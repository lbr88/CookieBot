const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting ClickManager Tests...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Helper to run a test case
    const runTestCase = async (name, setupFn, assertFn) => {
      process.stdout.write(`Test: ${name}... `);
      try {
        // Reset state before each test
        await page.evaluate(() => {
          // Reset Game basics
          Game.cookieClicks = 0;
          Game.lastClick = 0; // Ensure clicks aren't throttled
          Game.ascensionMode = 0;
          Game.buffs = {};

          // Reset Achievements
          if (Game.Achievements['Neverclick']) Game.Achievements['Neverclick'].won = 1;
          if (Game.Achievements['True Neverclick']) Game.Achievements['True Neverclick'].won = 1;
          if (Game.Achievements['Uncanny clicker']) Game.Achievements['Uncanny clicker'].won = 1;

          // Reset Bot Config
          const bot = window.AutoPlay;
          bot.reset();
          bot.Config.ClickMode = 1; // Default Normal
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
      'Mode 0 (OFF) should not click',
      () => {
        window.AutoPlay.Config.ClickMode = 0;
        window.AutoPlay.clickManager.handleClicking();
      },
      () => {
        return Game.cookieClicks === 0 ? true : `Expected 0 clicks, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'Neverclick Protection: Should NOT click if achievement missing and clicks <= 15',
      () => {
        Game.Achievements['Neverclick'].won = 0;
        Game.cookieClicks = 10;
        window.AutoPlay.clickManager.handleClicking();
      },
      () => {
        return Game.cookieClicks === 10 ? true : `Expected 10 clicks, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'Neverclick Protection: Should click if achievement won',
      () => {
        Game.Achievements['Neverclick'].won = 1;
        Game.cookieClicks = 10;
        window.AutoPlay.clickManager.handleClicking();
      },
      () => {
        return Game.cookieClicks > 10 ? true : `Expected >10 clicks, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'True Neverclick Protection: Should NOT click in Born Again + End Phase',
      () => {
        Game.Achievements['True Neverclick'].won = 0;
        Game.ascensionMode = 1; // Born Again
        Game.cookieClicks = 0;

        // Mock endPhase to return true
        window.AutoPlay.endPhase = () => true;

        window.AutoPlay.clickManager.handleClicking();
      },
      () => {
        return Game.cookieClicks === 0 ? true : `Expected 0 clicks, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'Uncanny Clicker: Should trigger rapid clicks if missing',
      async () => {
        Game.Achievements['Uncanny clicker'].won = 0;
        const startClicks = Game.cookieClicks;
        window.AutoPlay.clickManager.handleClicking();

        // Wait for timeouts to fire (50ms * 5 = 250ms)
        await new Promise(resolve => setTimeout(resolve, 300));
      },
      () => {
        // Should have clicked at least 5 times
        return Game.cookieClicks >= 5 ? true : `Expected >= 5 clicks, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'Normal Mode (1): Should click once per call',
      () => {
        window.AutoPlay.clickManager.handleClicking();
      },
      () => {
        // Note: handleClicking calls Game.ClickCookie() once directly
        return Game.cookieClicks > 0 ? true : `Expected clicks to increase, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'Frenzy Buff: Should click extra times',
      async () => {
        // Mock a buff
        Game.buffs['Click frenzy'] = {};
        const startClicks = Game.cookieClicks;
        window.AutoPlay.clickManager.handleClicking();

        // Wait for timeouts (30ms * 4 = 120ms)
        await new Promise(resolve => setTimeout(resolve, 200));
      },
      () => {
        // 1 normal click + 4 extra clicks = 5
        // But we can't be sure exactly how many fired, just check for > 1
        return Game.cookieClicks >= 2 ? true : `Expected >= 2 clicks with frenzy, got ${Game.cookieClicks}`;
      }
    );

    await runTestCase(
      'Aggressive Mode (2): Should use speedClicking',
      async () => {
        window.AutoPlay.Config.ClickMode = 2;
        const startClicks = Game.cookieClicks;
        window.AutoPlay.clickManager.handleClicking();

        // Wait for timeouts (30ms * 9 = 270ms)
        await new Promise(resolve => setTimeout(resolve, 300));
      },
      () => {
        // Aggressive mode fires 9 speed clicks + 1 normal click
        return Game.cookieClicks >= 5 ? true : `Expected many clicks in aggressive mode, got ${Game.cookieClicks}`;
      }
    );

    console.log('\nAll ClickManager tests passed!');

  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
