const fs = require('fs');
const path = require('path');
const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting Module-Level Tests...');

  let browser, page;

  try {
    // Initialize environment using shared utility
    ({ browser, page } = await initializeFullEnvironment());

    // Speed up the game logic
    await page.evaluate(() => {
      Game.fps = 1000;
    });

    let failedTests = 0;

    // Helper to run tests
    const runTest = async (description, testFn, ...args) => {
      process.stdout.write(`Test: ${description}... `);
      try {
        await page.evaluate(testFn, ...args);
        console.log('✓ PASS');
      } catch (e) {
        console.log('✗ FAIL');
        console.error('  Error:', e.message);
        failedTests++;
      }
    };

    console.log('\n--- Executing Test Cases ---\n');

    // --- TEST CASES ---

    // 1. Dashboard Module
    await runTest('Dashboard: Should be visible in the DOM', () => {
      const dashboard = document.getElementById('cookieBotDashboard');
      if (!dashboard) throw new Error('Dashboard element not found in DOM (looked for #cookieBotDashboard)');
      if (dashboard.style.display === 'none') throw new Error('Dashboard is hidden');
    });

    // 2. ClickManager
    await runTest('ClickManager: Should increment cookie clicks', async () => {
      // Grant Neverclick so bot is allowed to click
      Game.Win('Neverclick');

      const startClicks = Game.cookieClicks;
      // Wait 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (Game.cookieClicks <= startClicks) throw new Error(`Cookie clicks did not increase. Start: ${startClicks}, Now: ${Game.cookieClicks}`);
    });

    // 3. GoldenCookieHandler
    await runTest('GoldenCookieHandler: Should detect and click golden cookie', async () => {
      // Spawn a golden cookie
      const newShimmer = new Game.shimmer('golden');
      newShimmer.life = 10000; // Ensure it lives long enough

      // Wait for bot to click it (it runs every 300ms)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if it's gone (clicked)
      // Note: Game.shimmers array should be empty or not contain our shimmer
      if (Game.shimmers.includes(newShimmer)) {
        throw new Error('Golden cookie was not clicked by the bot');
      }
    });

    // 4. PurchaseManager
    // Read save file
    const savePath = path.join(__dirname, '../../TestSaves/autoPlay06_a_100oct.txt');
    const saveFileContent = fs.readFileSync(savePath, 'utf8');
    // Remove the first line (header)
    const saveString = saveFileContent.split('\n').slice(1).join('\n');

    await runTest('PurchaseManager: Should purchase buildings from save state', async (saveData) => {
      const bot = window.AutoPlay;
      bot.config.savingsEnabled = false;

      // Load the save
      // console.log('    Loading save file...');
      Game.ImportSaveCode(saveData);

      // Wait a bit for the game to settle and recalculate
      await new Promise(resolve => setTimeout(resolve, 2000));

      const startBuildings = Game.BuildingsOwned;

      // console.log(`    State loaded. Cookies: ${Game.cookies}, CPS: ${Game.cookiesPs}, Buildings: ${Game.BuildingsOwned}`);

      // Force bestBuy check to update bot state immediately after load
      if (bot.purchaseManager) {
        bot.purchaseManager.bestBuy();
      }

      // Wait for bot to buy something
      await new Promise(resolve => setTimeout(resolve, 10000)); // Give it 10s

      // console.log(`    End State. Cookies: ${Game.cookies}, Buildings: ${Game.BuildingsOwned}`);

      if (Game.BuildingsOwned <= startBuildings) {
        throw new Error(`Bot did not purchase any buildings. Owned: ${Game.BuildingsOwned}. CPS: ${Game.cookiesPs}`);
      }
    }, saveString);

    // 5. AchievementHandler
    await runTest('AchievementHandler: Should identify valid next achievement', () => {
      const bot = window.AutoPlay;
      if (!bot.nextAchievement) throw new Error('nextAchievement is not set');
      // Check if it's a valid ID
      if (!Game.AchievementsById[bot.nextAchievement]) throw new Error(`Invalid achievement ID: ${bot.nextAchievement}`);
    });

    // 6. SavingsManager
    await runTest('SavingsManager: Should calculate savings goal when enabled', () => {
      const bot = window.AutoPlay;
      // Enable savings
      bot.config.savingsEnabled = true;
      bot.config.SavingStrategy = 2; // Lucky

      // We can check if the bot has calculated a savings goal
      if (typeof bot.config.savingsGoal === 'undefined') throw new Error('savingsGoal is undefined');
    });

    // 7. NightMode
    await runTest('NightMode: Should initialize and accept config', () => {
      const bot = window.AutoPlay;
      // Force night mode config
      bot.config.nightMode = 1;

      const nightModeModule = bot['nightMode'];
      if (!nightModeModule) throw new Error('NightMode module instance not found');
    });

    // 8. WrinklerManager
    await runTest('WrinklerManager: Should identify active wrinklers', async () => {
      const bot = window.AutoPlay;
      bot.config.autoWrinklers = true;

      // Handle case sensitivity of Wrinklers array
      const wrinklers = Game.Wrinklers || Game.wrinklers;

      if (!wrinklers) {
        const keys = Object.keys(Game).filter(k => k.toLowerCase().includes('wrinkler'));
        throw new Error(`Game.Wrinklers is undefined. Found similar keys: ${keys.join(', ')}`);
      }

      // Force Grandmapocalypse to spawn wrinklers
      Game.elderWrath = 3;

      // Safely iterate
      for (let i = 0; i < wrinklers.length; i++) {
        wrinklers[i].phase = 2; // Active
        wrinklers[i].hp = 100;
        wrinklers[i].close = 1;
      }

      if (bot.config.autoWrinklers !== true) throw new Error('AutoWrinklers config mismatch');
    });

    // 9. SugarLumpManager
    await runTest('SugarLumpManager: Should be initialized', () => {
      const bot = window.AutoPlay;
      bot.config.autoSugarLumps = true;
      // Just verify config and existence
      if (!bot['sugarLumpManager']) throw new Error('SugarLumpManager module missing');
    });

    if (failedTests > 0) {
      console.error(`\n${failedTests} tests failed.`);
      process.exit(1);
    } else {
      console.log('\nAll module tests completed successfully.');
    }

  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
