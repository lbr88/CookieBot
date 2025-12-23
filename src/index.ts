/**
 * CookieBot - Automated Cookie Clicker Bot
 * Entry point for the application
 */

import AutoPlay from './AutoPlay';

// Export AutoPlay class as default for webpack
export default AutoPlay;

// Auto-initialize when loaded and expose instance globally
if (typeof Game !== 'undefined' && Game.ready) {
  const bot = new AutoPlay();
  (globalThis as any).AutoPlay = bot;
  console.log('CookieBot: Bot instance created and exposed globally:', bot);
  console.log('CookieBot: Verifying globalThis.AutoPlay:', (globalThis as any).AutoPlay);
  console.log('CookieBot: Bot state:', (bot as any).state);
  bot.init();
} else {
  console.log('CookieBot: Waiting for Cookie Clicker to be ready...');
  const checkReady = setInterval(() => {
    if (typeof Game !== 'undefined' && Game.ready) {
      clearInterval(checkReady);
      const bot = new AutoPlay();
      (globalThis as any).AutoPlay = bot;
      console.log('CookieBot: Bot instance created and exposed globally:', bot);
      console.log('CookieBot: Verifying globalThis.AutoPlay:', (globalThis as any).AutoPlay);
      console.log('CookieBot: Bot state:', (bot as any).state);
      bot.init();
    }
  }, 1000);
}
