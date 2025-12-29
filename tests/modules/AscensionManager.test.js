const { initializeFullEnvironment } = require('../utils/setup');
const fs = require('fs');
const path = require('path');

const SAVE_FILE_PATH = path.resolve(__dirname, '../../TestSaves/autoPlay06_a_100oct.txt');

(async () => {
  console.log('Starting AscensionManager Real Save Test...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    // Forward console logs from the browser to Node.js terminal
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    const fileContent = fs.readFileSync(SAVE_FILE_PATH, 'utf8');
    const lines = fileContent.split('\n');
    let saveCode = lines.find(line => line.startsWith('Mi4'));
    if (!saveCode) {
      saveCode = lines.sort((a, b) => b.length - a.length)[0];
    }

    console.log('Importing save...');
    await page.evaluate((code) => {
      Game.ImportSaveCode(code);
    }, saveCode);

    // Setup spies to track game actions
    await page.evaluate(() => {
      window.testSpies = {
        reincarnateCalled: false,
        permanentSlots: []
      };

      // Spy on PutUpgradeInPermanentSlot
      const originalPutUpgrade = Game.PutUpgradeInPermanentSlot;
      Game.PutUpgradeInPermanentSlot = function(upgradeId, slotId) {
        window.testSpies.permanentSlots.push({ upgradeId, slotId });
        return originalPutUpgrade.apply(Game, arguments);
      };

      // Spy on Reincarnate
      const originalReincarnate = Game.Reincarnate;
      Game.Reincarnate = function(bypass) {
        window.testSpies.reincarnateCalled = true;
        console.log('BROWSER: SPY: Game.Reincarnate called. Cookies before: ' + Game.cookies + ', Resets: ' + Game.resets);
        const result = originalReincarnate.apply(Game, arguments);
        console.log('BROWSER: SPY: Game.Reincarnate returned. Cookies after: ' + Game.cookies + ', Resets: ' + Game.resets);
        return result;
      };
    });

    console.log('Waiting for bot to process state (up to 40s)...');

    // Wait for Reincarnate to be called (which happens after ascension triggers)
    try {
      await page.waitForFunction(() => window.testSpies.reincarnateCalled === true, { timeout: 40000, polling: 1000 });
    } catch (e) {
      console.log('Timeout waiting for reincarnation. Checking state...');
    }

    const finalState = await page.evaluate(() => {
      const am = window.AutoPlay.ascensionManager;
      return {
        onAscend: window.Game.OnAscend,
        reincarnateCalled: window.testSpies.reincarnateCalled,
        permanentSlots: window.testSpies.permanentSlots,
        activities: am.context.activities,
        prestige: window.Game.prestige,
        ascendMeterLevel: window.Game.ascendMeterLevel,
        heavenlyChips: window.Game.heavenlyChips,
        // Check if permanent slots are unlocked
        slot1Unlocked: window.Game.UpgradesById[264].bought, // Permanent upgrade slot I
        slot2Unlocked: window.Game.UpgradesById[265].bought, // Permanent upgrade slot II
        slot3Unlocked: window.Game.UpgradesById[266].bought, // Permanent upgrade slot III
        slot4Unlocked: window.Game.UpgradesById[267].bought, // Permanent upgrade slot IV
        slot5Unlocked: window.Game.UpgradesById[268].bought  // Permanent upgrade slot V
      };
    });

    console.log('Final State:', finalState);

    if (finalState.reincarnateCalled) {
      console.log('✓ PASS: Game.Reincarnate was called.');
    } else {
      console.log('✗ FAIL: Game.Reincarnate was NOT called.');
      throw new Error('Bot failed to trigger reincarnation.');
    }
    // Wait for game to resume (OnAscend should become 0)
    console.log('Waiting for game to resume after reincarnation (10s)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    const postReincarnationState = await page.evaluate(() => {
      return {
        onAscend: window.Game.OnAscend,
        cookies: window.Game.cookies,
        resets: window.Game.resets,
        activities: window.AutoPlay.ascensionManager.context.activities,
        botDefined: typeof window.AutoPlay !== 'undefined'
      };
    });

    console.log('Post-Reincarnation State:', postReincarnationState);

    if (postReincarnationState.onAscend === 0) {
      console.log('✓ PASS: Game is no longer on Ascend screen.');
    } else {
      console.log('✗ FAIL: Game is still on Ascend screen.');
    }

    if (postReincarnationState.cookies < 1e18) { // Threshold increased as Permaslots can generate massive cookies quickly
      console.log('✓ PASS: Cookies are within expected early-game range (considering Permaslots).');
    } else {
      console.log('⚠ WARN: Cookies seem very high? (Value: ' + postReincarnationState.cookies + ')');
    }

    if (postReincarnationState.botDefined) {
      console.log('✓ PASS: Bot is still defined and running.');
    } else {
      console.log('✗ FAIL: Bot instance was lost after reincarnation.');
    }
    if (finalState.permanentSlots.length > 0) {
      console.log(`✓ PASS: ${finalState.permanentSlots.length} permanent slots were assigned.`);
      finalState.permanentSlots.forEach(slot => {
        console.log(`  - Slot ${slot.slotId}: Upgrade ${slot.upgradeId}`);
      });
    } else {
      // Only a failure if slots were unlocked but not assigned
      if (finalState.slot1Unlocked) {
        console.log('✗ FAIL: Permanent slots are unlocked but none were assigned.');
        throw new Error('Bot failed to assign permanent slots.');
      } else {
        console.log('⚠ WARN: No permanent slots assigned, but Slot I is locked, so this might be expected.');
      }
    }

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
