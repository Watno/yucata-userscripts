// ==UserScript==
// @name         Yucata lobby chat: Enter to send
// @namespace    yucata-lobby-chat-enter
// @version      1.0.1
// @description  Enter sends private lobby messages; Shift+Enter inserts a line break. Public chat is unchanged.
// @match        https://yucata.de/*
// @match        https://*.yucata.de/*
// @match        http://yucata.de/*
// @match        http://*.yucata.de/*
// @run-at       document-start
// @grant        none
// @author       Watno
// @license      MIT
// @homepageURL  https://github.com/Watno/yucata-userscripts
// @supportURL   https://github.com/Watno/yucata-userscripts/issues
// @updateURL    https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-lobby-chat-enter.meta.js
// @downloadURL  https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-lobby-chat-enter.user.js
// @noframes
// ==/UserScript==

(() => {
    'use strict';

    const attachedDocuments = new WeakSet();
    const attachedFrames = new WeakSet();

    function autocompleteIsOpen() {
        // Keep Enter available to choose a mention or emoji suggestion.
        return [...document.querySelectorAll('.tox-autocompleter')]
            .some(menu => menu.getClientRects().length > 0);
    }

    function onKeyDown(event) {
        if (event.key !== 'Enter') return;
        const target = event.target;
        const doc = target?.ownerDocument;
        const isPrivateEditor = doc !== document &&
            doc?.defaultView?.frameElement?.id === 'chat-input_ifr' &&
            target?.isContentEditable;
        if (!isPrivateEditor) return;
        if (target.disabled || target.readOnly) return;

        // Do not let the site's Enter shortcut send while confirming IME input.
        if (event.isComposing || event.keyCode === 229) {
            event.stopImmediatePropagation();
            return;
        }
        // Native TinyMCE Shift+Enter preserves selection and undo.
        if (event.shiftKey) return;
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        if (autocompleteIsOpen()) return;

        const send = document.getElementById('send-button');
        if (!send) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        // Holding Enter must not submit repeatedly. Let the existing click handler
        // manage empty messages, uploads, permissions, draft clearing and delivery.
        if (!event.repeat && !send.disabled && send.getAttribute('aria-disabled') !== 'true') {
            send.click();
        }
    }

    function attachDocument(doc) {
        if (!doc || attachedDocuments.has(doc)) return;
        attachedDocuments.add(doc);
        doc.addEventListener('keydown', onKeyDown, true);
    }

    function attachEditor() {
        const frame = document.getElementById('chat-input_ifr');
        if (!frame) return;
        if (!attachedFrames.has(frame)) {
            attachedFrames.add(frame);
            frame.addEventListener('load', attachEditor);
        }
        // TinyMCE recreates the iframe whenever the private channel changes.
        try {
            attachDocument(frame.contentDocument);
        } catch {
            // Ignore a frame if the site ever navigates it to another origin.
        }
    }

    new MutationObserver(attachEditor).observe(document, { childList: true, subtree: true });
    attachEditor();
})();
