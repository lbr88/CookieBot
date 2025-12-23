/**
 * CookieBot - Automated Cookie Clicker Bot
 * Entry point for the application
 */

import AutoPlay from './AutoPlay';

// Export AutoPlay as default for webpack to expose as global
export default AutoPlay;

// Auto-initialize when loaded
if (typeof Game !== 'undefined' && Game.ready) {
  const bot = new AutoPlay();
  bot.init();
} else {
  console.log('CookieBot: Waiting for Cookie Clicker to be ready...');
  const checkReady = setInterval(() => {
    if (typeof Game !== 'undefined' && Game.ready) {
      clearInterval(checkReady);
      const bot = new AutoPlay();
      bot.init();
    }
  }, 1000);
}
