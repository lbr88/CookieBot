const { launchBrowser, setupPage, loadGame, injectCookieMonster, injectBot } = require('../tests/utils/setup');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const headless = process.argv.includes('--headless');
const useChrome = process.argv.includes('--chrome');
const useFirefox = !useChrome; // Default to Firefox

// Parse context flag
const contextArg = process.argv.find(arg => arg.startsWith('--context='));
const contextName = contextArg ? contextArg.split('=')[1] : 'default';

// Helper to format numbers
const formatNumber = (num) => {
  if (num >= 1e33) return (num / 1e33).toFixed(3) + ' dec';
  if (num >= 1e30) return (num / 1e30).toFixed(3) + ' non';
  if (num >= 1e27) return (num / 1e27).toFixed(3) + ' oct';
  if (num >= 1e24) return (num / 1e24).toFixed(3) + ' sept';
  if (num >= 1e21) return (num / 1e21).toFixed(3) + ' sext';
  if (num >= 1e18) return (num / 1e18).toFixed(3) + ' quint';
  if (num >= 1e15) return (num / 1e15).toFixed(3) + ' quad';
  if (num >= 1e12) return (num / 1e12).toFixed(3) + ' T';
  if (num >= 1e9) return (num / 1e9).toFixed(3) + ' B';
  if (num >= 1e6) return (num / 1e6).toFixed(3) + ' M';
  if (num >= 1e3) return (num / 1e3).toFixed(3) + ' k';
  return Math.floor(num).toString();
};

(async () => {
  console.log(`Starting game in ${headless ? 'HEADLESS' : 'BROWSER'} mode using ${useFirefox ? 'FIREFOX' : 'CHROME'}...`);
  if (contextName) {
    console.log(`Using context: ${contextName}`);
  }
  console.log('Console logs from the browser will be piped here.');
  console.log('Commands:');
  console.log('  [s] - Show status (Cookies, CPS, etc.)');
  console.log('  [m] - Show module status');
  console.log('  [l] - Toggle console logging');
  console.log('  [c] - Click big cookie');
  console.log('  [q] - Quit');

  try {
    // Setup persistent profile if context is used
    let userDataDir = null;
    if (contextName) {
      userDataDir = path.join(__dirname, '../profiles', `profile-${contextName}`);
      if (!fs.existsSync(userDataDir)) {
        fs.mkdirSync(userDataDir, { recursive: true });
      }
      console.log(`Using persistent profile: ${userDataDir}`);
    }

    const browser = await launchBrowser({ 
      headless: headless ? "new" : false,
      browser: useFirefox ? 'firefox' : 'chrome',
      userDataDir: userDataDir
    });
    const page = await setupPage(browser, { logConsole: true });
    
    await loadGame(page);

    // Load save if context exists
    if (contextName) {
      const savesDir = path.join(__dirname, '../saves');
      if (!fs.existsSync(savesDir)) {
        fs.mkdirSync(savesDir);
      }
      
      const savePath = path.join(savesDir, `${contextName}.txt`);
      if (fs.existsSync(savePath)) {
        const saveString = fs.readFileSync(savePath, 'utf8');
        console.log('Loading save from context...');
        await page.evaluate((save) => {
          if (typeof Game !== 'undefined' && Game.ImportSaveCode) {
            Game.ImportSaveCode(save);
          }
        }, saveString);
      } else {
        console.log('No save found for this context. Starting fresh.');
      }
    }

    // Inject mods AFTER loading save
    await injectCookieMonster(page);
    await injectBot(page);

    // Enable console logging automatically
    await page.evaluate(() => {
      if (typeof AutoPlay !== 'undefined') {
        AutoPlay.Config.ConsoleLog = 1;
        if (AutoPlay.configManager && AutoPlay.configManager.config) {
          AutoPlay.configManager.config['ConsoleLog'] = 1;
        }
        console.log('Console logging enabled.');
      }
    });

    console.log('Game is running.');

    // Periodic status update (every 10 seconds)
    setInterval(async () => {
      try {
        const stats = await page.evaluate(() => {
          if (typeof Game === 'undefined' || !Game.ready) return null;

          let ascStatus = '-';
          let achStatus = '-';
          let buyStatus = 'Idle';

          // Helper to format time
          const formatTime = (ms) => {
            if (!ms || !isFinite(ms)) return '--';
            const s = Math.ceil(ms / 1000);
            if (s < 60) return s + 's';
            if (s < 3600) return Math.floor(s / 60) + 'm ' + (s % 60) + 's';
            return Math.floor(s / 3600) + 'h ' + Math.floor((s % 3600) / 60) + 'm';
          };

          if (typeof AutoPlay !== 'undefined') {
            // Ascension
            if (AutoPlay.ascensionManager && AutoPlay.ascensionManager.getStatus) {
              const s = AutoPlay.ascensionManager.getStatus();
              if (s) ascStatus = s.currentAction;
            }

            // Achievement
            if (AutoPlay.achievementHandler && AutoPlay.achievementHandler.getStatus) {
              const s = AutoPlay.achievementHandler.getStatus();
              if (s) achStatus = s.currentAction;
            }
            if (Game.AchievementsOwned !== undefined) {
              achStatus += ` (${Game.AchievementsOwned}/${Game.AchievementsN})`;
            }

            // Purchase
            if (AutoPlay.purchaseManager) {
              const pm = AutoPlay.purchaseManager;
              const b = pm.getBuildingStatus ? pm.getBuildingStatus() : null;
              const u = pm.getUpgradeStatus ? pm.getUpgradeStatus() : null;

              let active = null;
              if (b && b.status === 'active') active = b;
              else if (u && u.status === 'active') active = u;

              if (active && active.details) {
                const name = active.details['Next Building'] || active.details['Next Upgrade'] || 'Unknown';

                let progressStr = '';
                if (active.progress) {
                  const current = Beautify(Math.floor(active.progress.current), 0);
                  const target = Beautify(Math.floor(active.progress.target), 0);
                  progressStr = ` (${current}/${target})`;
                }

                let timeStr = '';
                if (active.timeRemaining) {
                  timeStr = ` [${formatTime(active.timeRemaining)}]`;
                }

                buyStatus = `${name}${progressStr}${timeStr}`;
              }
            }
          }

          return {
            cookiesStr: Beautify(Math.floor(Game.cookies), 0),
            cpsStr: Beautify(Game.cookiesPs),
            buildings: Game.BuildingsOwned,
            upgrades: Game.UpgradesOwned,
            lumps: Game.lumps,
            ascStatus,
            achStatus,
            buyStatus
          };
        });

        if (stats) {
          const time = new Date().toLocaleTimeString();
          console.log(`[${time}] 🍪 ${stats.cookiesStr} | CPS: ${stats.cpsStr} | Bld: ${stats.buildings} | Upg: ${stats.upgrades} | Lumps: ${Math.floor(stats.lumps)}`);
          console.log(`           Target: ${stats.buyStatus} | Ach: ${stats.achStatus} | Asc: ${stats.ascStatus}`);
        }

        // Auto-save context every minute
        if (contextName) {
          const saveString = await page.evaluate(() => {
            if (typeof Game !== 'undefined' && Game.WriteSave) {
              return Game.WriteSave(1);
            }
            return null;
          });

          if (saveString) {
            const savesDir = path.join(__dirname, '../saves');
            const savePath = path.join(savesDir, `${contextName}.txt`);
            fs.writeFileSync(savePath, saveString);
            // console.log('Context saved.');
          }
        }

      } catch (e) {
        // Ignore errors (e.g. if page closed)
      }
    }, 10000);

    // Setup keyboard input
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', async (str, key) => {
      if (key.ctrl && key.name === 'c') {
        // Save on exit
        if (contextName) {
          console.log('Saving context before exit...');
          try {
            const saveString = await page.evaluate(() => {
              if (typeof Game !== 'undefined' && Game.WriteSave) {
                return Game.WriteSave(1);
              }
              return null;
            });
            if (saveString) {
              const savesDir = path.join(__dirname, '../saves');
              const savePath = path.join(savesDir, `${contextName}.txt`);
              fs.writeFileSync(savePath, saveString);
              console.log('Context saved.');
            }
          } catch (e) {
            console.error('Failed to save context on exit:', e.message);
          }
        }
        process.exit();
      }

      if (key.name === 'c' && !key.ctrl) {
        await page.evaluate(() => {
          if (typeof Game !== 'undefined' && Game.ClickCookie) {
            Game.ClickCookie();
          }
        });
        console.log('Clicked cookie.');
      }

      if (key.name === 'q') {
        console.log('Exiting...');
        // Save on quit
        if (contextName) {
          console.log('Saving context...');
          try {
            const saveString = await page.evaluate(() => {
              if (typeof Game !== 'undefined' && Game.WriteSave) {
                return Game.WriteSave(1);
              }
              return null;
            });
            if (saveString) {
              const savesDir = path.join(__dirname, '../saves');
              const savePath = path.join(savesDir, `${contextName}.txt`);
              fs.writeFileSync(savePath, saveString);
              console.log('Context saved.');
            }
          } catch (e) {
            console.error('Failed to save context on quit:', e.message);
          }
        }
        await browser.close();
        process.exit();
      }

      if (key.name === 's') {
        const stats = await page.evaluate(() => {
          if (typeof Game === 'undefined') return 'Game not loaded';
          return `
--- Game Status ---
Cookies: ${Game.cookies}
CPS: ${Game.cookiesPs}
Prestige: ${Game.prestige}
Ascension Mode: ${Game.ascensionMode}
Season: ${Game.season}
Dragon Level: ${Game.dragonLevel}
          `;
        });
        console.log(stats);
      }

      if (key.name === 'm') {
        const modules = await page.evaluate(() => {
          if (typeof AutoPlay === 'undefined') return 'Bot not loaded';
          const statuses = {};
          const context = AutoPlay;

          // Helper to get status safely
          const get = (manager) => manager && manager.getStatus ? manager.getStatus() : null;

          const list = [
            { name: 'Clicking', mgr: context.clickManager },
            { name: 'Purchase', mgr: context.purchaseManager },
            { name: 'Golden', mgr: context.goldenCookieHandler },
            { name: 'Wrinkler', mgr: context.wrinklerManager },
            { name: 'Dragon', mgr: context.dragonManager },
            { name: 'Season', mgr: context.seasonHandler },
            { name: 'Ascension', mgr: context.ascensionManager },
            { name: 'Savings', mgr: context.savingsManager },
            { name: 'Sugar Lump', mgr: context.sugarLumpManager },
            { name: 'Achievement', mgr: context.achievementHandler },
            { name: 'Night Mode', mgr: context.nightMode },
            { name: 'Pantheon', mgr: context.pantheonManager },
            { name: 'Grimoire', mgr: context.grimoireManager },
            { name: 'Garden', mgr: context.gardenManager },
            { name: 'Stock Market', mgr: context.stockMarketManager },
          ];

          return list.map(item => {
            if (item.name === 'Purchase') {
              const bStatus = item.mgr && item.mgr.getBuildingStatus ? item.mgr.getBuildingStatus() : null;
              const uStatus = item.mgr && item.mgr.getUpgradeStatus ? item.mgr.getUpgradeStatus() : null;

              let res = [];
              if (bStatus) res.push(`Purchase (Buildings): [${bStatus.status}] ${bStatus.currentAction || ''}`);
              if (uStatus) res.push(`Purchase (Upgrades): [${uStatus.status}] ${uStatus.currentAction || ''}`);
              return res.length ? res.join('\n') : 'Purchase: N/A';
            }

            const s = get(item.mgr);
            if (!s) return `${item.name}: N/A`;
            return `${item.name}: [${s.status}] ${s.currentAction || ''} ${s.reason ? '(' + s.reason + ')' : ''}`;
          }).join('\n');
        });
        console.log('\n--- Module Status ---');
        console.log(modules);
        console.log('---------------------\n');
      }

      if (key.name === 'l') {
        const result = await page.evaluate(() => {
          if (typeof AutoPlay === 'undefined') return 'Bot not loaded';
          // Toggle
          const current = AutoPlay.Config.ConsoleLog;
          AutoPlay.configManager.toggleConfigUp('ConsoleLog');
          return `Console Logging: ${current ? 'OFF' : 'ON'}`;
        });
        console.log(result);
      }
    });

    // Keep alive indefinitely
    await new Promise(() => { });

  } catch (error) {
    console.error('Failed to start game:', error);
    process.exit(1);
  }
})();
