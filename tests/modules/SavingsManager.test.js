const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting SavingsManager Tests...');

  let browser, page;

  try {
    // Initialize environment using shared utility
    ({ browser, page } = await initializeFullEnvironment());

    // --- Helper to run a test case ---
    const runTestCase = async (name, setupFn, assertFn) => {
      process.stdout.write(`Test: ${name}... `);
      try {
        // Reset state before each test
        await page.evaluate(() => {
          // Reset Game basics
          Game.cookies = 1000000;
          Game.unbuffedCps = 100;
          Game.ascensionMode = 0;
          Game.startDate = Date.now();

          // Reset Upgrades (Lucky day, Serendipity, Get lucky)
          if (Game.UpgradesById[52]) Game.UpgradesById[52].bought = 0;
          if (Game.UpgradesById[53]) Game.UpgradesById[53].bought = 0;
          if (Game.UpgradesById[86]) Game.UpgradesById[86].bought = 0;

          // Reset Bot Config
          const bot = window.AutoPlay;
          bot.reset();
          bot.Config.SavingStrategy = 1; // Default AUTO

          // Reset SavingsManager internal state
          // We need to re-initialize it or manually reset properties if exposed
          // Since we can't easily re-new the class, we'll rely on handleSavings recalculating
          // But we need to reset savingsStart
          bot.savingsManager.initializeSavings(Date.now());
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
        throw e; // Re-throw to fail the suite
      }
    };

    // --- Test Cases ---

    await runTestCase(
      'Strategy 0 (NONE) should have 0 savings',
      () => {
        window.AutoPlay.Config.SavingStrategy = 0;
        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        return goal === 0 ? true : `Expected 0, got ${goal}`;
      }
    );

    await runTestCase(
      'Strategy 2 (LUCKY) should save 100 mins of CPS',
      () => {
        window.AutoPlay.Config.SavingStrategy = 2;
        Game.unbuffedCps = 100;
        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        const expected = 100 * 60 * 100; // 600,000
        return goal === expected ? true : `Expected ${expected}, got ${goal}`;
      }
    );

    await runTestCase(
      'Strategy 3 (LUCKY FRENZY) should save 700 mins of CPS',
      () => {
        window.AutoPlay.Config.SavingStrategy = 3;
        Game.unbuffedCps = 100;
        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        const expected = 100 * 60 * 100 * 7; // 4,200,000
        return goal === expected ? true : `Expected ${expected}, got ${goal}`;
      }
    );

    await runTestCase(
      'AUTO: Startup period (< 30 mins) should have 0 savings',
      () => {
        window.AutoPlay.Config.SavingStrategy = 1;
        // Mock time: 10 mins after start
        const now = Date.now();
        Game.startDate = now - (10 * 60 * 1000);

        // We need to inject the time into SavingsManager or mock Date.now()
        // SavingsManager uses this.now which is updated by setCurrentTime or handleSavings?
        // Let's check the code... it uses this.now which is updated in periodic() -> handleSavings()
        // But handleSavings() uses this.now.
        // We need to update this.now manually or call setCurrentTime
        window.AutoPlay.savingsManager.setCurrentTime(now);
        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        return goal === 0 ? true : `Expected 0, got ${goal}`;
      }
    );

    await runTestCase(
      'AUTO: Missing upgrades should have 0 savings',
      () => {
        window.AutoPlay.Config.SavingStrategy = 1;
        // Time: 60 mins after start (past startup)
        const now = Date.now();
        Game.startDate = now - (60 * 60 * 1000);
        window.AutoPlay.savingsManager.setCurrentTime(now);

        // Ensure upgrades are NOT bought
        Game.UpgradesById[52].bought = 0; // Lucky day

        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        return goal === 0 ? true : `Expected 0, got ${goal}`;
      }
    );

    await runTestCase(
      'AUTO: Ramp up (halfway)',
      () => {
        window.AutoPlay.Config.SavingStrategy = 1;
        // Time: 30 mins startup + 200 mins (half of 400) = 230 mins
        const now = Date.now();
        Game.startDate = now - (230 * 60 * 1000);

        // Sync savingsStart
        window.AutoPlay.savingsManager.initializeSavings(Game.startDate);
        window.AutoPlay.savingsManager.setCurrentTime(now);

        // Buy required upgrades
        Game.UpgradesById[52].bought = 1;
        Game.UpgradesById[53].bought = 1;
        Game.unbuffedCps = 100;

        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        const maxGoal = 100 * 60 * 100; // 600,000
        const expected = maxGoal * 0.5; // 300,000
        // Allow small floating point diff
        return Math.abs(goal - expected) < 1 ? true : `Expected ~${expected}, got ${goal}`;
      }
    );

    await runTestCase(
      'AUTO: Max savings (after 430 mins)',
      () => {
        window.AutoPlay.Config.SavingStrategy = 1;
        // Time: 30 mins startup + 401 mins
        const now = Date.now();
        Game.startDate = now - (431 * 60 * 1000);

        // Sync savingsStart
        window.AutoPlay.savingsManager.initializeSavings(Game.startDate);
        window.AutoPlay.savingsManager.setCurrentTime(now);

        Game.UpgradesById[52].bought = 1;
        Game.UpgradesById[53].bought = 1;
        Game.unbuffedCps = 100;

        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        const expected = 100 * 60 * 100; // 600,000
        return goal === expected ? true : `Expected ${expected}, got ${goal}`;
      }
    );

    await runTestCase(
      'AUTO: Get Lucky upgrade multiplies by 7',
      () => {
        window.AutoPlay.Config.SavingStrategy = 1;
        // Time: Max time
        const now = Date.now();
        Game.startDate = now - (500 * 60 * 1000);

        // Sync savingsStart
        window.AutoPlay.savingsManager.initializeSavings(Game.startDate);
        window.AutoPlay.savingsManager.setCurrentTime(now);

        Game.UpgradesById[52].bought = 1;
        Game.UpgradesById[53].bought = 1;
        Game.UpgradesById[86].bought = 1; // Get Lucky
        Game.unbuffedCps = 100;

        window.AutoPlay.savingsManager.handleSavings();
      },
      () => {
        const goal = window.AutoPlay.savingsManager.getSavingsGoal();
        const expected = 100 * 60 * 100 * 7; // 4,200,000
        return goal === expected ? true : `Expected ${expected}, got ${goal}`;
      }
    );

    console.log('\nAll Puppeteer tests passed!');

  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
