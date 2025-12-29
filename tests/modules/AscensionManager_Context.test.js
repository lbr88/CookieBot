const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting AscensionManager Context Test...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    // Forward console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Check if AscensionManager has access to context arrays
    const contextCheck = await page.evaluate(() => {
      const am = window.AutoPlay.ascensionManager;
      const ctx = am.context;
      
      return {
        kittens: ctx.kittens,
        maxBuildings: ctx.maxBuildings,
        cursors: ctx.cursors,
        butterBiscuits: ctx.butterBiscuits,
        expensive: ctx.expensive,
        kittensIsArray: Array.isArray(ctx.kittens),
        expensiveIsArray: Array.isArray(ctx.expensive)
      };
    });

    console.log('Context Check:', contextCheck);

    if (contextCheck.kittensIsArray && contextCheck.expensiveIsArray) {
      console.log('✓ PASS: Context arrays are correctly accessible.');
    } else {
      console.log('✗ FAIL: Context arrays are missing or invalid.');
      throw new Error('Context arrays missing');
    }

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
