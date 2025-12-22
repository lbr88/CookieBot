// ==UserScript==
// @name CookieBot
// @include /https?://orteil.dashnet.org/cookieclicker/
// ==/UserScript==

const readyCheck = setInterval(() => {
 const Game = unsafeWindow.Game;

 if (typeof Game !== 'undefined' && typeof Game.ready !== 'undefined' && Game.ready) {
  Game.LoadMod('https://raw.githubusercontent.com/lbr88/CookieBot/development/cookieAutoPlayBeta.js');
  clearInterval(readyCheck);
 }
}, 1000);
