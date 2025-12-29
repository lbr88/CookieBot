const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting GoldenCookieHandler Tests...');

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
          window.AutoPlay.Config.GoldenClickMode = 1; // Default to Normal
          window.AutoPlay.Config.CheatGolden = 0;

          // Reset Game State mocks
          window.Game.shimmers = [];
          window.Game.shimmerTypes = {
            golden: { n: 0, maxTime: 1000, time: 0 }
          };
          window.Game.TickerEffect = null;
          window.Game.tickerL = { click: () => { } };
          window.Game.Achievements = {
            'Four-leaf cookie': { won: 0 },
            'Early bird': { won: 1 },
            'Fading luck': { won: 1 }
          };
          window.Game.Upgrades = {
            'Lucky payout': { bought: 0 },
            'Distilled essence of redoubled luck': { bought: 0 }
          };
          window.Game.Objects = {
            'Wizard tower': { amount: 0 }
          };
          window.Game.buffs = {};
          window.Game.cookies = 1000;
          window.Game.fps = 30;

          // Reset Bot State
          window.AutoPlay.goldenCookieHandler.resetHyperActive();

          // Reset test tracking variables
          window.lastPoppedShimmer = null;
          window.tickerClicked = false;
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
      'should not do anything if GoldenClickMode is 0 (Disabled)',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 0;

        // Add a shimmer that would normally be clicked
        const mockShimmer = {
          type: 'golden',
          life: 1000,
          dur: 1000,
          force: '',
          pop: () => { window.lastPoppedShimmer = 'golden'; }
        };
        window.Game.shimmers = [mockShimmer];

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.lastPoppedShimmer === null ? true : `Expected null, got ${window.lastPoppedShimmer}`;
      }
    );

    await runTestCase(
      'should click golden cookie in Normal mode',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 1;

        const mockShimmer = {
          type: 'golden',
          life: 1000,
          dur: 1000,
          force: '',
          pop: () => { window.lastPoppedShimmer = 'golden'; }
        };
        window.Game.shimmers = [mockShimmer];

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.lastPoppedShimmer === 'golden' ? true : `Expected 'golden', got ${window.lastPoppedShimmer}`;
      }
    );

    await runTestCase(
      'should click ticker if TickerEffect is present',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 1;
        window.Game.TickerEffect = { type: 'fortune' };
        window.Game.tickerL = { click: () => { window.tickerClicked = true; } };

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.tickerClicked === true ? true : 'Expected ticker to be clicked';
      }
    );

    await runTestCase(
      'should set hyperActive if multiple golden cookies are present',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 1;
        window.Game.shimmerTypes['golden'].n = 2;

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.AutoPlay.goldenCookieHandler.isHyperActive() === true ? true : 'Expected hyperActive to be true';
      }
    );

    await runTestCase(
      'should wait for Four-leaf cookie achievement if conditions met',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 1;
        window.Game.shimmerTypes['golden'].n = 4;
        window.Game.Achievements['Four-leaf cookie'].won = 0;

        const mockShimmer = {
          type: 'golden',
          life: 1000,
          dur: 1000,
          pop: () => { window.lastPoppedShimmer = 'golden'; }
        };
        window.Game.shimmers = [mockShimmer];

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.lastPoppedShimmer === null ? true : `Expected null (waiting), got ${window.lastPoppedShimmer}`;
      }
    );

    await runTestCase(
      'should NOT click fresh cookie storm drop in Normal mode',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 1; // Normal

        const mockShimmer = {
          type: 'golden',
          force: 'cookie storm drop',
          life: 300, // 10 seconds (Fresh)
          dur: 10,   // 10 seconds
          pop: () => { window.lastPoppedShimmer = 'storm'; }
        };
        window.Game.shimmers = [mockShimmer];

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.lastPoppedShimmer === null ? true : `Expected null, got ${window.lastPoppedShimmer}`;
      }
    );

    await runTestCase(
      'should click fresh cookie storm drop in Aggressive mode',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 2; // Aggressive

        const mockShimmer = {
          type: 'golden',
          force: 'cookie storm drop',
          life: 300, // 10 seconds (Fresh)
          dur: 10,   // 10 seconds
          pop: () => { window.lastPoppedShimmer = 'storm'; }
        };
        window.Game.shimmers = [mockShimmer];

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.lastPoppedShimmer === 'storm' ? true : `Expected 'storm', got ${window.lastPoppedShimmer}`;
      }
    );

    await runTestCase(
      'should click reindeer (non-golden shimmer)',
      () => {
        window.AutoPlay.Config.GoldenClickMode = 1;

        const mockShimmer = {
          type: 'reindeer',
          life: 1000,
          dur: 1000,
          pop: () => { window.lastPoppedShimmer = 'reindeer'; }
        };
        window.Game.shimmers = [mockShimmer];

        window.AutoPlay.goldenCookieHandler.handleGoldenCookies();
      },
      () => {
        return window.lastPoppedShimmer === 'reindeer' ? true : `Expected 'reindeer', got ${window.lastPoppedShimmer}`;
      }
    );

    console.log('\nAll GoldenCookieHandler tests passed!');

  } catch (error) {
    console.error('Test Suite Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();