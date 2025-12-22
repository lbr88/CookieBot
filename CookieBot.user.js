// ==UserScript==
// @name CookieBot
// @namespace https://github.com/lbr88/CookieBot
// @version 2.052
// @description Automated bot for Cookie Clicker game
// @author lbr88
// @include /https?://orteil.dashnet.org/cookieclicker/
// @updateURL https://github.com/lbr88/CookieBot/raw/development/CookieBot.user.js
// @downloadURL https://github.com/lbr88/CookieBot/raw/development/CookieBot.user.js
// @grant none
// ==/UserScript==

const readyCheck = setInterval(() => {
 const Game = unsafeWindow.Game;

 if (typeof Game !== 'undefined' && typeof Game.ready !== 'undefined' && Game.ready) {
  Game.LoadMod('https://raw.githubusercontent.com/lbr88/CookieBot/development/cookieAutoPlayBeta.js');
  clearInterval(readyCheck);
 }
}, 1000);
