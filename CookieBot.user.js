// ==UserScript==
// @name CookieBot
// @namespace https://github.com/lbr88/CookieBot
// @version 2.052.1
// @description Automated bot for Cookie Clicker game
// @author lbr88
// @include /https?://orteil.dashnet.org/cookieclicker/
// @updateURL https://lbr88.github.io/CookieBot/CookieBot.user.js
// @downloadURL https://lbr88.github.io/CookieBot/CookieBot.user.js
// @grant none
// ==/UserScript==

const readyCheck = setInterval(() => {
 const Game = unsafeWindow.Game;

 if (typeof Game !== 'undefined' && typeof Game.ready !== 'undefined' && Game.ready) {
  Game.LoadMod('https://lbr88.github.io/CookieBot/cookieAutoPlayBeta.js');
  clearInterval(readyCheck);
 }
}, 1000);
