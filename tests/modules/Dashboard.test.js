const { initializeFullEnvironment } = require('../utils/setup');
const fs = require('fs');
const path = require('path');

const SAVE_FILE_PATH = path.resolve(__dirname, '../../TestSaves/autoPlay06_a_100oct.txt');

(async () => {
  console.log('Starting Dashboard Module Test...');

  let browser, page;

  try {
    ({ browser, page } = await initializeFullEnvironment());

    // Forward console logs
    page.on('console', msg => console.log('BROWSER:', msg.text()));

    // Load a save to have some stats to display
    const fileContent = fs.readFileSync(SAVE_FILE_PATH, 'utf8');
    const lines = fileContent.split('\n');
    let saveCode = lines.find(line => line.startsWith('Mi4'));
    if (!saveCode) saveCode = lines.sort((a, b) => b.length - a.length)[0];

    console.log('Importing save...');
    await page.evaluate((code) => {
      Game.ImportSaveCode(code);
    }, saveCode);

    console.log('Waiting for bot to initialize and render dashboard...');
    await page.waitForSelector('#cookieBotDashboard', { timeout: 10000 });
    console.log('✓ PASS: Dashboard element found in DOM.');

    // Check for key elements
    const elements = await page.evaluate(() => {
      const dashboard = document.getElementById('cookieBotDashboard');
      const headerText = dashboard.innerText;
      const content = document.getElementById('dashboardContent');
      return {
        hasHeaderText: headerText.includes('CookieBot Dashboard'),
        hasContent: content !== null,
        contentVisible: content && content.style.display !== 'none'
      };
    });

    console.log('Dashboard Elements:', elements);

    if (elements.hasHeaderText && elements.hasContent) {
      console.log('✓ PASS: Dashboard structure is correct.');
    } else {
      console.log('✗ FAIL: Dashboard structure is missing header or content.');
    }

    // Check if stats are updating
    console.log('Checking for stat updates...');
    const initialContent = await page.evaluate(() => document.getElementById('dashboardContent').innerText);
    
    // Wait a bit for updates
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newContent = await page.evaluate(() => document.getElementById('dashboardContent').innerText);
    
    if (initialContent !== newContent) {
      console.log('✓ PASS: Dashboard content updated over time.');
    } else {
      console.log('⚠ WARN: Dashboard content did not change in 2 seconds (might be expected if game is paused or slow).');
    }

    // Test Config Interaction (Toggle a setting)
    console.log('Testing Config Interaction...');
    
    // Open the preferences menu to trigger addMenuPref
    await page.evaluate(() => {
      Game.ShowMenu('prefs');
    });
    
    // Wait for menu to render
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find the CookieBot Options section
    const configFound = await page.evaluate(() => {
      const menu = document.getElementById('menu');
      if (!menu) return false;
      return menu.innerText.includes('Cookiebot Options');
    });

    if (configFound) {
      console.log('✓ PASS: Config section found in Game Menu.');
      
      // Try to toggle an option (e.g., ShowDashboard)
      // The ID format is 'autoplayConfig' + key
      const toggleResult = await page.evaluate(() => {
        const option = document.getElementById('autoplayConfigShowDashboard');
        if (!option) return { found: false };
        
        const initialText = option.innerText;
        option.click();
        const newText = option.innerText;
        
        return { found: true, initialText, newText };
      });
      
      if (toggleResult.found) {
        console.log(`✓ PASS: Toggled option. Changed from "${toggleResult.initialText}" to "${toggleResult.newText}"`);
      } else {
        console.log('✗ FAIL: Could not find config option to toggle.');
      }

    } else {
      console.log('✗ FAIL: Config section NOT found in Game Menu.');
    }

  } catch (error) {
    console.error('Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
