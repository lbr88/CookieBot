const { initializeFullEnvironment } = require('../utils/setup');

(async () => {
  console.log('Starting GrimoireManager Test...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    // Forward console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Setup mock environment for Grimoire
    await page.evaluate(() => {
      // Mock Wizard Tower and Minigame
      Game.Objects['Wizard tower'] = {
        amount: 600,
        level: 10,
        minigame: {
          magic: 100,
          magicM: 100,
          spells: {
            'hand of fate': { id: 1, name: 'Hand of Fate' },
            'conjure baked goods': { id: 2, name: 'Conjure Baked Goods' }
          },
          getSpellCost: (spell) => 10, // Cheap spells for testing
          castSpell: (spell) => {
            console.log(`BROWSER: MOCK: castSpell called for ${spell.name}`);
            Game.Objects['Wizard tower'].minigame.magic -= 10;
          },
          lumpRefill: {
            click: () => console.log('BROWSER: MOCK: lumpRefill clicked')
          }
        },
        sell: (amount) => console.log(`BROWSER: MOCK: Sold ${amount} towers`)
      };
      
      Game.isMinigameReady = (obj) => true;
      
      // Mock Achievements/Upgrades
      Game.Achievements['Four-leaf cookie'] = { won: 0 };
      Game.Upgrades['Distilled essence of redoubled luck'] = { bought: 1 };
      
      // Mock Golden Cookies
      Game.shimmerTypes = {
        'golden': { n: 0 }
      };
      
      // Mock Lumps
      Game.lumps = 150;
    });

    console.log('Testing Four-leaf Cookie Strategy...');
    await page.evaluate(() => {
      // Set 2 golden cookies
      Game.shimmerTypes['golden'].n = 2;
      
      const gm = window.AutoPlay.grimoireManager;
      gm.handleGrimoires();
    });
    // Should cast Hand of Fate
    // We check logs for "castSpell called for Hand of Fate"

    console.log('Testing Backfire Farming...');
    await page.evaluate(() => {
      // Reset
      Game.Achievements['Four-leaf cookie'].won = 1; // Disable first strategy
      Game.shimmerTypes['golden'].n = 1;
      Game.Objects['Wizard tower'].minigame.magic = 98; // 98%
      
      const gm = window.AutoPlay.grimoireManager;
      gm.handleGrimoires();
    });
    // Should cast Hand of Fate

    console.log('Testing High CpS Strategy...');
    await page.evaluate(() => {
      // Reset
      Game.shimmerTypes['golden'].n = 0; // No golden cookies
      Game.Objects['Wizard tower'].minigame.magic = 50;
      
      // Set high CpS mult
      window.AutoPlay.grimoireManager.context.cpsMult = 200;
      
      const gm = window.AutoPlay.grimoireManager;
      gm.handleGrimoires();
    });
    // Should cast Hand of Fate (or Conjure Baked Goods if HoF fails/too expensive, but here HoF is cheap)

    console.log('Testing Lump Refill...');
    await page.evaluate(() => {
       // Drain magic
       Game.Objects['Wizard tower'].minigame.magic = 0;
       window.AutoPlay.grimoireManager.context.canUseLumps = true;
       
       const gm = window.AutoPlay.grimoireManager;
       gm.handleGrimoires();
    });
    // Should click lump refill

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
