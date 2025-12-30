const { initializeFullEnvironment } = require('./utils/setup');

(async () => {
  console.log('Starting Dashboard Overlap Repro Test...');

  let browser, page;

  try {
    // Initialize environment (headless: "new" is default, but we can set it to false to see it if needed, 
    // but for automated testing we keep it headless)
    ({ browser, page } = await initializeFullEnvironment({ headless: "new" }));

    // Dismiss cookie consent if present (Try multiple methods)
    try {
      // Method 1: Standard class
      const consentBtn = await page.$('.cc-dismiss');
      if (consentBtn) {
        console.log('Dismissing cookie consent (class)...');
        await consentBtn.click();
      } else {
        // Method 2: Text search (Updated for specific buttons seen in screenshot)
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('a, button, div.cc-btn'));

          // 1. Click "Got it!" on the yellow banner
          const gotIt = buttons.find(b => b.innerText && b.innerText.includes('Got it!'));
          if (gotIt) {
            console.log('Clicking "Got it!"...');
            gotIt.click();
          }

          // 2. Click "Consent" on the large DashNet modal
          const consent = buttons.find(b => b.innerText && b.innerText.trim() === 'Consent');
          if (consent) {
            console.log('Clicking "Consent"...');
            consent.click();
          }
        });

        // Method 3: Brute force hide common consent classes and the specific fc-consent-root if present
        await page.evaluate(() => {
          const style = document.createElement('style');
          style.innerHTML = `
            .cc-window, .cc-banner, .cc-revoke { display: none !important; opacity: 0 !important; pointer-events: none !important; }
            .fc-consent-root, .fc-dialog-container, .fc-ab-root { display: none !important; }
            div[aria-label="Privacy and cookie settings"] { display: none !important; }
            iframe[title="Privacy and cookie settings"] { display: none !important; }
          `;
          document.head.appendChild(style);
        });

        await new Promise(r => setTimeout(r, 1000)); // Wait for fade out

        // Verify consent is gone
        const consentVisible = await page.evaluate(() => {
          const banner = document.querySelector('.cc-window');
          return banner && window.getComputedStyle(banner).display !== 'none' && window.getComputedStyle(banner).opacity !== '0';
        });
        if (consentVisible) console.log('WARNING: Cookie consent might still be visible!');
        else console.log('Cookie consent appears to be dismissed/hidden.');
      } // End of else block for Method 2
    } catch (e) {
      console.log('Error handling cookie consent:', e.message);
    }

    console.log('Waiting for dashboard to appear...');
    await page.waitForSelector('#cookieBotDashboard', { timeout: 10000 });

    // Wait a bit for the initial positioning timeout (100ms in code)
    await new Promise(r => setTimeout(r, 2000));

    console.log('Checking layout...');

    const layoutMetrics = await page.evaluate(() => {
      const dashboard = document.getElementById('cookieBotDashboard');
      const game = document.getElementById('game');

      if (!dashboard || !game) {
        return { error: 'Elements not found' };
      }

      const dashboardHeight = dashboard.offsetHeight;
      const dashboardRect = dashboard.getBoundingClientRect();
      const gameRect = game.getBoundingClientRect();
      const gameStyleBottom = game.style.bottom;
      const gameComputedBottom = window.getComputedStyle(game).bottom;

      return {
        dashboardHeight,
        dashboardTop: dashboardRect.top,
        gameBottom: gameRect.bottom,
        gameStyleBottom,
        gameComputedBottom,
        windowHeight: window.innerHeight
      };
    });

    console.log('Layout Metrics:', layoutMetrics);

    if (layoutMetrics.error) {
      throw new Error(layoutMetrics.error);
    }

    // Check if game bottom is adjusted for dashboard height
    // The game div should end where the dashboard begins (or higher)
    // game.style.bottom should be approx dashboardHeight (assuming no other bars)

    const bottomVal = parseFloat(layoutMetrics.gameComputedBottom);
    const dashHeight = layoutMetrics.dashboardHeight;

    console.log(`Game Bottom: ${bottomVal}px`);
    console.log(`Dashboard Height: ${dashHeight}px`);

    if (bottomVal < dashHeight) {
      console.error('❌ FAIL: Game overlaps with dashboard!');
      console.error(`Game bottom (${bottomVal}px) is less than dashboard height (${dashHeight}px)`);
      process.exit(1);
    } else {
      console.log('✓ PASS: Game does not overlap dashboard.');
    }

    // Test Mini Dashboard Content
    console.log('Testing Mini Dashboard...');

    // Click collapse button (click the header as the listener is on the header)
    await page.evaluate(() => {
      const header = document.querySelector('#cookieBotDashboard > div:first-child');
      if (header) header.click();
    });
    await new Promise(r => setTimeout(r, 1000)); // Wait for animation/render

    // Check if mini modules container is visible
    const miniVisible = await page.evaluate(() => {
      const mini = document.getElementById('dashMiniModules');
      return mini && window.getComputedStyle(mini).display !== 'none';
    });

    if (miniVisible) {
      console.log('✓ PASS: Mini dashboard is visible when collapsed.');

      // Verify "Next update" is hidden
      const nextUpdateHidden = await page.evaluate(() => {
        const nextUpdate = document.getElementById('dashboardNextUpdate');
        return nextUpdate && window.getComputedStyle(nextUpdate).display === 'none';
      });

      if (nextUpdateHidden) {
        console.log('✓ PASS: "Next update" text is hidden in mini view.');
      } else {
        console.error('❌ FAIL: "Next update" text is visible in mini view!');
      }

      // Take a screenshot for visual verification
      await page.screenshot({ path: 'dashboard_mini_view.png', clip: { x: 0, y: 0, width: 800, height: 600 } });
      console.log('📸 Screenshot saved to dashboard_mini_view.png');

      // Analyze the "look" by inspecting the DOM structure and styles
      const analysis = await page.evaluate(() => {
        const container = document.getElementById('dashMiniModules');
        if (!container) return 'No container';

        const modules = Array.from(container.children);
        return modules.map(m => {
          const htmlM = m;
          const textSpan = htmlM.querySelector('span:nth-child(2)'); // Usually the text part
          const timeSpan = htmlM.querySelector('span:last-child');

          return {
            fullText: htmlM.innerText.replace(/\n/g, ' '),
            backgroundColor: window.getComputedStyle(htmlM).backgroundColor,
            width: window.getComputedStyle(htmlM).width,
            textPart: textSpan ? textSpan.innerText : 'N/A',
            textColor: textSpan ? window.getComputedStyle(textSpan).color : 'N/A',
            timePart: timeSpan ? timeSpan.innerText : 'N/A'
          };
        });
      });

      console.log('🔍 Visual Analysis of Mini Modules:');
      console.log(JSON.stringify(analysis, null, 2));

    } else {
      console.error('❌ FAIL: Mini dashboard is NOT visible when collapsed.');
    }

  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
})();
