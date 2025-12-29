const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting DragonManager Test...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    // Forward console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Setup mock environment for Dragon
    await page.evaluate(() => {
      // Mock Dragon Levels
      Game.dragonLevels = [];
      for (let i = 0; i < 25; i++) {
        Game.dragonLevels.push({
          cost: () => true // Always affordable for test
        });
      }
      Game.dragonLevel = 5; // Start at level 5 (Breath of Milk unlocked)
      Game.dragonAura = 0;
      Game.dragonAura2 = 0;
      
      // Mock Upgrades
      Game.Upgrades['A crumbly egg'] = { unlocked: 1 };
      
      // Mock Special Menu functions
      Game.specialTab = '';
      Game.UpgradeDragon = () => {
        console.log('BROWSER: MOCK: UpgradeDragon called');
        Game.dragonLevel++;
      };
      Game.SetDragonAura = (aura, slot) => {
        console.log(`BROWSER: MOCK: SetDragonAura called with aura ${aura} for slot ${slot}`);
        if (slot === 0) Game.dragonAura = aura;
        if (slot === 1) Game.dragonAura2 = aura;
      };
      Game.ToggleSpecialMenu = () => {};
      Game.ConfirmPrompt = () => {};
      Game.ClickSpecialPic = () => {
        console.log('BROWSER: MOCK: ClickSpecialPic called (Petting)');
      };
      
      // Mock Has/HasUnlocked for drops
      Game.Has = (what) => false; // Don't have drops
      Game.HasUnlocked = (what) => false;
    });

    console.log('Testing Dragon Training...');
    await page.evaluate(() => {
      const dm = window.AutoPlay.dragonManager;
      dm.handleDragon();
    });

    // Check if dragon leveled up
    const level = await page.evaluate(() => Game.dragonLevel);
    if (level > 5) {
      console.log(`✓ PASS: Dragon leveled up to ${level}.`);
    } else {
      console.log(`✗ FAIL: Dragon did not level up (Level: ${level}).`);
    }

    console.log('Testing Aura Selection...');
    // Set level to 20 (max auras unlocked)
    await page.evaluate(() => {
      Game.dragonLevel = 24; // Max level
      const dm = window.AutoPlay.dragonManager;
      dm.handleDragon();
    });

    const auras = await page.evaluate(() => ({
      aura1: Game.dragonAura,
      aura2: Game.dragonAura2
    }));

    // Expect Radiant Appetite (15) or Dragon's Curve (17) for Aura 1
    // Expect Breath of Milk (1) for Aura 2
    console.log('Auras:', auras);
    
    if ((auras.aura1 === 15 || auras.aura1 === 17) && auras.aura2 === 1) {
      console.log('✓ PASS: Auras selected correctly.');
    } else {
      console.log('✗ FAIL: Incorrect aura selection.');
    }

    console.log('Testing Dragon Petting...');
    // Should have petted because drops are missing (mocked above)
    // We can't easily check if it clicked, but we saw the log.
    // Let's check if activity was added
    const activity = await page.evaluate(() => window.AutoPlay.activities);
    if (activity.includes('Petting the dragon')) {
      console.log('✓ PASS: Petting activity logged.');
    } else {
      console.log('✗ FAIL: Petting activity not logged.');
    }

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
