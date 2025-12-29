
const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting WrinklerManager Tests...');

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

          // Reset Game State mocks
          window.Game.season = '';
          window.Game.Upgrades = {
            'One mind': { bought: 1 }, // Default to unlocked
            'Unholy bait': { bought: 0 }
          };
          window.Game.Achievements = {
            'Moistburster': { won: 1 },
            'Last Chance to See': { won: 1 },
            'Wrinkler poker': { won: 1 }
          };

          // Mock Wrinklers
          window.Game.wrinklers = [];
          for (let i = 0; i < 10; i++) {
            window.Game.wrinklers.push({
              id: i,
              close: 1, // Attached
              sucked: 100,
              type: 0, // Normal
              hp: 3, // Alive
              selected: 0
            });
          }
          window.Game.getWrinklersMax = () => 10;

          // Reset Bot State
          window.AutoPlay.wrinklerManager.context.poppingWrinklers = false;
          window.AutoPlay.wrinklerManager.context.wrinklerTime = Date.now() - (3 * 60 * 60 * 1000); // 3 hours ago
          window.AutoPlay.wrinklerManager.context.nextWrinkler = -1;

          // Mock seasonFinished
          window.AutoPlay.seasonFinished = () => false;

          // Mock isEndPhase (via wantedAchievements)
          window.AutoPlay.wantedAchievements = [1, 2, 3];
          window.AutoPlay.nextAchievement = 1; // Not end phase
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

    await runTestCase(
      'Should NOT do anything if One Mind not bought',
      () => {
        window.Game.Upgrades['One mind'].bought = 0;
        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        // Check if any wrinkler was popped (hp set to 0)
        const popped = window.Game.wrinklers.some(w => w.hp === 0);
        return !popped ? true : 'Wrinklers were popped despite One Mind not bought';
      }
    );

    await runTestCase(
      'Should pop ALL wrinklers during Easter season',
      () => {
        window.Game.season = 'easter';
        window.AutoPlay.seasonFinished = () => false;
        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const allPopped = window.Game.wrinklers.every(w => w.hp === 0);
        return allPopped ? true : 'Not all wrinklers were popped during Easter';
      }
    );

    await runTestCase(
      'Should pop ALL wrinklers during Halloween season',
      () => {
        window.Game.season = 'halloween';
        window.AutoPlay.seasonFinished = () => false;
        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const allPopped = window.Game.wrinklers.every(w => w.hp === 0);
        return allPopped ? true : 'Not all wrinklers were popped during Halloween';
      }
    );

    await runTestCase(
      'Should pop ALL wrinklers for Moistburster achievement',
      () => {
        window.Game.Upgrades['Unholy bait'].bought = 1;
        window.Game.Achievements['Moistburster'].won = 0;
        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const allPopped = window.Game.wrinklers.every(w => w.hp === 0);
        return allPopped ? true : 'Not all wrinklers were popped for Moistburster';
      }
    );

    await runTestCase(
      'Should pop ALL wrinklers in End Phase for Last Chance to See',
      () => {
        // Simulate End Phase
        window.AutoPlay.wantedAchievements = [];
        window.AutoPlay.nextAchievement = 999; // Not in wanted list

        window.Game.Achievements['Last Chance to See'].won = 0;
        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const allPopped = window.Game.wrinklers.every(w => w.hp === 0);
        return allPopped ? true : 'Not all wrinklers were popped for Last Chance to See';
      }
    );

    await runTestCase(
      'Should pop SINGLE wrinkler if 2 hours passed',
      () => {
        // Ensure not popping all
        window.Game.season = '';

        // Set time to > 2 hours ago
        window.AutoPlay.wrinklerManager.context.wrinklerTime = Date.now() - (2.1 * 60 * 60 * 1000);

        // Set one wrinkler to have max sucked
        window.Game.wrinklers[5].sucked = 999999;

        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const poppedCount = window.Game.wrinklers.filter(w => w.hp === 0).length;
        const poppedId = window.Game.wrinklers.findIndex(w => w.hp === 0);

        if (poppedCount !== 1) return `Expected 1 popped, got ${poppedCount}`;
        if (poppedId !== 5) return `Expected wrinkler 5 popped, got ${poppedId}`;
        return true;
      }
    );

    await runTestCase(
      'Should NOT pop single wrinkler if < 2 hours passed',
      () => {
        // Set time to < 2 hours ago
        window.AutoPlay.wrinklerManager.context.wrinklerTime = Date.now() - (1.9 * 60 * 60 * 1000);

        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const poppedCount = window.Game.wrinklers.filter(w => w.hp === 0).length;
        return poppedCount === 0 ? true : `Expected 0 popped, got ${poppedCount}`;
      }
    );

    await runTestCase(
      'Should NOT pop single wrinkler if slots are not full',
      () => {
        // Set time to > 2 hours ago
        window.AutoPlay.wrinklerManager.context.wrinklerTime = Date.now() - (3 * 60 * 60 * 1000);

        // Make one slot empty
        window.Game.wrinklers[9].close = 0;

        window.AutoPlay.wrinklerManager.handleWrinklers();
      },
      () => {
        const poppedCount = window.Game.wrinklers.filter(w => w.hp === 0).length;
        return poppedCount === 0 ? true : `Expected 0 popped (waiting for full), got ${poppedCount}`;
      }
    );

    await runTestCase(
      'Should identify Shiny Wrinkler correctly',
      () => {
        window.Game.wrinklers[0].type = 1; // Shiny
      },
      () => {
        const isShiny = window.AutoPlay.wrinklerManager.isShinyWrinkler(window.Game.wrinklers[0]);
        const isNormal = window.AutoPlay.wrinklerManager.isShinyWrinkler(window.Game.wrinklers[1]);

        if (!isShiny) return 'Failed to identify shiny wrinkler';
        if (isNormal) return 'Incorrectly identified normal wrinkler as shiny';
        return true;
      }
    );

    await runTestCase(
      'Should calculate Wrinkler Value correctly (Normal vs Shiny)',
      () => {
        window.Game.wrinklers[0].sucked = 100;
        window.Game.wrinklers[0].type = 0; // Normal

        window.Game.wrinklers[1].sucked = 100;
        window.Game.wrinklers[1].type = 1; // Shiny
      },
      () => {
        const normalValue = window.AutoPlay.wrinklerManager.getWrinklerValue(window.Game.wrinklers[0]);
        const shinyValue = window.AutoPlay.wrinklerManager.getWrinklerValue(window.Game.wrinklers[1]);

        // Normal: 100 * 1.1 = 110
        // Shiny: 100 * 1.1 * 3 = 330

        if (Math.abs(normalValue - 110) > 0.1) return `Expected normal value ~110, got ${normalValue}`;
        if (Math.abs(shinyValue - 330) > 0.1) return `Expected shiny value ~330, got ${shinyValue}`;
        return true;
      }
    );

    console.log('\nAll WrinklerManager tests passed!');

  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
