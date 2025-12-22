// ==UserScript==
// @name         CookieBot - Auto Cookie Clicker
// @namespace    https://github.com/prinzstani/CookieBot
// @version      2.052
// @description  Automated bot for Cookie Clicker game - handles purchasing, achievements, ascension, and more
// @author       prinzstani, Lars Bo Rasmussen
// @match        https://orteil.dashnet.org/cookieclicker/
// @match        http://orteil.dashnet.org/cookieclicker/
// @match        https://orteil.dashnet.org/cookieclicker/beta/
// @match        http://orteil.dashnet.org/cookieclicker/beta/
// @icon         https://orteil.dashnet.org/cookieclicker/img/favicon.ico
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    console.log('CookieBot userscript initializing...');

    // Wait for Cookie Clicker to load
    function initCookieBot() {
        if (typeof Game === 'undefined' || !Game.ready) {
            setTimeout(initCookieBot, 1000);
            return;
        }

        console.log('Cookie Clicker loaded, injecting CookieBot...');

        // Load CookieBot from GitHub
        // Change this URL to point to your fork's raw file or your own hosted version
        var script = document.createElement('script');
        script.src = 'https://raw.githubusercontent.com/prinzstani/CookieBot/development/cookieAutoPlayBeta.js';
        script.onload = function() {
            console.log('CookieBot loaded successfully!');
            if (typeof AutoPlay !== 'undefined') {
                console.log('CookieBot version:', AutoPlay.version);
            }
        };
        script.onerror = function() {
            console.error('Failed to load CookieBot from GitHub. Make sure the URL is correct.');
        };
        document.head.appendChild(script);
    }

    // Start initialization
    initCookieBot();
})();
