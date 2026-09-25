// ==UserScript==
// @name         Yucata: always show forum link
// @namespace    yucata-always-show-forum
// @version      1.0.1
// @description  Keep the top-bar forum link visible even when there are no unread messages.
// @match        https://yucata.de/*
// @match        https://*.yucata.de/*
// @match        http://yucata.de/*
// @match        http://*.yucata.de/*
// @run-at       document-start
// @grant        GM_addStyle
// @author       Watno
// @license      MIT
// @homepageURL  https://github.com/Watno/yucata-userscripts
// @supportURL   https://github.com/Watno/yucata-userscripts/issues
// @updateURL    https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-always-show-forum.meta.js
// @downloadURL  https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-always-show-forum.user.js
// @noframes
// ==/UserScript==

(() => {
    'use strict';

    GM_addStyle(`
        /* Override Bootstrap hiding without changing the site's unread state. */
        #forummenulink {
            display: block !important;
        }

        /* The site may leave an old count in the badge when hiding the link. */
        #forummenulink.d-none #forum-unread-count,
        #forummenulink #forum-unread-count:empty {
            display: none !important;
        }
    `);
})();
