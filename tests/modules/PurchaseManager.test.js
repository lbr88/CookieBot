
const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting PurchaseManager Tests...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    // Helper to run a test case
    const runTestCase = async (name, setupFn, assertFn) => {
      process.stdout.write(`Test: ${name}... `);
      try {
        // Reset state before each test
        await page.evaluate(() => {
          // Reset Config
          window.AutoPlay.reset();
          window.AutoPlay.Config.SavingsMode = 0; // Disable savings for purchase tests by default

          // Reset Game State mocks
          window.Game.cookies = 1000000;
          window.Game.cookiesPs = 100;
          window.Game.fps = 30;
          window.Game.startDate = Date.now() - 10000000; // Long time ago
          window.Game.buyMode = 1;
          window.Game.onMenu = '';
          window.Game.resets = 0;
          window.Game.ascensionMode = 0;
          window.Game.BuildingsOwned = 10;
          window.Game.UpgradesOwned = 10;
          window.Game.dragonLevel = 0;
          window.Game.dragonLevels = [];

          // Mock Objects (Buildings)
          window.Game.ObjectsById = [];
          window.Game.Objects = {};
          const buildingNames = ['Cursor', 'Grandma', 'Farm', 'Mine'];
          buildingNames.forEach((name, i) => {
            const price = 100 * Math.pow(10, i);
            const cps = 1 * Math.pow(5, i);
            const obj = {
              name: name,
              id: i,
              amount: 10,
              price: price,
              basePrice: price,
              storedCps: cps,
              locked: 0,
              getSumPrice: (n) => price * n, // Simplified
              getPrice: () => price,
              buy: (n) => {
                window.lastBought = { type: 'building', name: name, amount: n };
                window.Game.cookies -= price * n;
                window.Game.Objects[name].amount += n;
              }
            };
            window.Game.ObjectsById.push(obj);
            window.Game.Objects[name] = obj;
          });

          // Mock Upgrades
          window.Game.UpgradesById = [];
          window.Game.Upgrades = {};
          window.Game.UpgradesInStore = [];

          // Mock Achievements
          window.Game.Achievements = {
            'Hardcore': { won: 1 }, // Default to won so we can buy upgrades
            'Here be dragon': { won: 0 },
            'Neverclick': { won: 1 },
            'Elder nap': { won: 0 },
            'Grandmapocalypse': { won: 0 },
            'Elder slumber': { won: 0 },
            'Elder calm': { won: 0 },
            'Thick-skinned': { won: 0 }
          };

          // Mock CookieMonsterData (Undefined by default)
          window.CookieMonsterData = undefined;

          // Reset test tracking
          window.lastBought = null;
        });

        // Run setup
        await page.evaluate(setupFn);

        // Run assertion
        const result = await page.evaluate(assertFn);

        if (result === true) {
          console.log('✓ PASS');
        } else {
          console.log('✗ FAIL');
          console.error('  Reason:', result);
          throw new Error(result);
        }
      } catch (e) {
        console.log('✗ ERROR');
        console.error('  Error:', e.message);
        throw e;
      }
    };

    // --- Test Cases ---

    // 1. Fallback Strategy (No CookieMonster)

    await runTestCase(
      'Fallback: Should buy cheapest building if no buildings owned',
      () => {
        window.Game.BuildingsOwned = 0;
        window.Game.cookies = 200;
        // Cursor price 100, Grandma 1000
        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        if (!window.lastBought) return 'Nothing bought';
        if (window.lastBought.name !== 'Cursor') return `Expected Cursor, got ${window.lastBought.name}`;
        return true;
      }
    );

    await runTestCase(
      'Fallback: Should buy most efficient building (CPS/Price)',
      () => {
        window.Game.BuildingsOwned = 10;
        window.Game.cookies = 100000;

        // Cursor: Price 100, CPS 1. Ratio: 0.01
        // Grandma: Price 1000, CPS 5. Ratio: 0.005
        // Farm: Price 10000, CPS 25. Ratio: 0.0025

        // Let's make Grandma super efficient
        window.Game.Objects['Grandma'].storedCps = 500; // Ratio 0.5

        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        if (!window.lastBought) return 'Nothing bought';
        if (window.lastBought.name !== 'Grandma') return `Expected Grandma, got ${window.lastBought.name}`;
        return true;
      }
    );

    await runTestCase(
      'Fallback: Should respect savings goal',
      () => {
        window.Game.cookies = 1000;
        window.AutoPlay.savingsGoal = 950; // Only 50 available
        // Cursor costs 100. Should not buy.

        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        return window.lastBought === null ? true : `Expected nothing, got ${window.lastBought.name}`;
      }
    );

    // 2. CookieMonster Strategy

    await runTestCase(
      'CookieMonster: Should buy building with lowest PP',
      () => {
        // Mock CookieMonsterData
        window.CookieMonsterData = {
          Cache: { AverageClicks: 10, WrinklersTotal: 0 },
          Objects1: {
            'Cursor': { pp: 100 },
            'Grandma': { pp: 10 }, // Best PP
            'Farm': { pp: 50 }
          },
          Upgrades: {}
        };

        window.Game.cookies = 100000;
        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        if (!window.lastBought) return 'Nothing bought';
        if (window.lastBought.name !== 'Grandma') return `Expected Grandma, got ${window.lastBought.name}`;
        return true;
      }
    );

    await runTestCase(
      'CookieMonster: Should buy upgrade if it has lowest PP',
      () => {
        // Mock Upgrade
        const upgrade = {
          name: 'Reinforced index finger',
          id: 1,
          bought: 0,
          unlocked: 1,
          pool: '',
          getPrice: () => 500,
          buy: () => { window.lastBought = { type: 'upgrade', name: 'Reinforced index finger' }; }
        };
        window.Game.UpgradesInStore = [upgrade];
        window.Game.Upgrades['Reinforced index finger'] = upgrade;
        window.Game.UpgradesById.push(upgrade);

        window.CookieMonsterData = {
          Cache: { AverageClicks: 10, WrinklersTotal: 0 },
          Objects1: {
            'Cursor': { pp: 100 }
          },
          Upgrades: {
            'Reinforced index finger': { pp: 5 } // Better than Cursor (100)
          }
        };

        window.Game.cookies = 100000;
        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        if (!window.lastBought) return 'Nothing bought';
        if (window.lastBought.type !== 'upgrade') return `Expected upgrade, got ${window.lastBought.type}`;
        if (window.lastBought.name !== 'Reinforced index finger') return `Expected Reinforced index finger, got ${window.lastBought.name}`;
        return true;
      }
    );

    // 3. Upgrade Avoidance

    await runTestCase(
      'Should avoid Chocolate egg',
      () => {
        const upgrade = {
          name: 'Chocolate egg',
          id: 227,
          bought: 0,
          unlocked: 1,
          pool: '',
          getPrice: () => 100,
          buy: () => { window.lastBought = { type: 'upgrade', name: 'Chocolate egg' }; }
        };
        window.Game.UpgradesInStore = [upgrade];
        window.Game.Upgrades['Chocolate egg'] = upgrade;

        // Even with super low PP, it should be avoided
        window.CookieMonsterData = {
          Cache: { AverageClicks: 10, WrinklersTotal: 0 },
          Objects1: { 'Cursor': { pp: 1000 } },
          Upgrades: { 'Chocolate egg': { pp: 1 } }
        };

        window.Game.cookies = 100000;
        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        if (window.lastBought && window.lastBought.name === 'Chocolate egg') {
          return 'Bought Chocolate egg (should have avoided)';
        }
        return true;
      }
    );

    await runTestCase(
      'Should NOT buy upgrades if Hardcore achievement not won and 0 upgrades owned',
      () => {
        window.Game.Achievements['Hardcore'].won = 0;
        window.Game.UpgradesOwned = 0;

        const upgrade = {
          name: 'Cursor upgrade',
          id: 1,
          bought: 0,
          unlocked: 1,
          pool: '',
          getPrice: () => 100,
          buy: () => { window.lastBought = { type: 'upgrade', name: 'Cursor upgrade' }; }
        };
        window.Game.UpgradesInStore = [upgrade];
        window.Game.Upgrades['Cursor upgrade'] = upgrade;

        window.CookieMonsterData = {
          Cache: { AverageClicks: 10, WrinklersTotal: 0 },
          Objects1: { 'Cursor': { pp: 1000 } },
          Upgrades: { 'Cursor upgrade': { pp: 1 } }
        };

        window.Game.cookies = 100000;
        window.AutoPlay.purchaseManager.bestBuy();
      },
      () => {
        // Should buy building instead (Cursor) because upgrades are blocked
        if (!window.lastBought) return 'Nothing bought';
        if (window.lastBought.type !== 'building') return `Expected building, got ${window.lastBought.type}`;
        return true;
      }
    );

    console.log('\nAll PurchaseManager tests passed!');

  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
