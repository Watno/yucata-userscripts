// ==UserScript==
// @name         Yucata: merge pending invitations
// @namespace    yucata-merge-pending-invitations
// @version      1.0.1
// @description  Combine waiting-for-start and sent invitations in one lobby section, even when either is empty.
// @match        https://yucata.de/*
// @match        https://*.yucata.de/*
// @match        http://yucata.de/*
// @match        http://*.yucata.de/*
// @run-at       document-end
// @grant        none
// @author       Watno
// @license      MIT
// @homepageURL  https://github.com/Watno/yucata-userscripts
// @supportURL   https://github.com/Watno/yucata-userscripts/issues
// @updateURL    https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-merge-pending-invitations.meta.js
// @downloadURL  https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-merge-pending-invitations.user.js
// @noframes
// ==/UserScript==

(() => {
    'use strict';

    function install() {
        const waiting = document.getElementById('waitingInvitesSection');
        const y = window.y$;
        const $ = window.jQuery;
        if (!waiting || !y?.base?.api?.fetch || !y?.invitationutils?.renderInvitesGraphic
            || !y?.invitationlobby?.loadWaitingInvitations || !y?.gameslobby?.renderGenericCarousel
            || !y?.invitationsent?.cancelInvitation || !$) return false;
        if (waiting.dataset.mergedSentInvitations) return true;
        waiting.dataset.mergedSentInvitations = 'true';

        const originalFetch = y.base.api.fetch;
        const originalGraphic = y.invitationutils.renderInvitesGraphic;
        let sentIds = new Set();
        let latestRequest = 0;
        let refreshTimer;

        function refresh() {
            clearTimeout(refreshTimer);
            refreshTimer = setTimeout(() => y.invitationlobby.loadWaitingInvitations(true), 0);
        }

        // Feed the combined data into the existing waiting section. Its renderer
        // still owns visibility, count, view preference, carousel, and DataTable.
        y.base.api.fetch = async function (url, options, ...rest) {
            const method = (options?.method || 'GET').toUpperCase();
            if (url === '/api/me/invitations/waiting' && method === 'GET') {
                const request = ++latestRequest;
                const [waitingItems, sentItems] = await Promise.all([
                    originalFetch.call(this, url, options, ...rest),
                    originalFetch.call(this, '/api/me/invitations/sent')
                ]);
                const combined = new Map();
                for (const item of waitingItems || []) combined.set(String(item.id), item);
                for (const item of sentItems || []) combined.set(String(item.id), item);
                if (request === latestRequest) {
                    sentIds = new Set((sentItems || []).map(item => String(item.id)));
                }
                return [...combined.values()];
            }
            const result = await originalFetch.call(this, url, options, ...rest);
            // Cancellation does not always emit invitations:changed. Refresh only
            // after the site's own request succeeded, preserving its error handling.
            if (method !== 'GET' && typeof url === 'string' && url.startsWith('/api/invitations/')) refresh();
            return result;
        };

        function cancelButton(id) {
            return $('<button>', {
                type: 'button', class: 'btn btn-danger px-1 py-0 fs-5',
                title: window.i18next.t('Invitation.CancelInvitation', { defaultValue: 'Cancel invitation' }),
                'aria-label': window.i18next.t('Invitation.CancelInvitation', { defaultValue: 'Cancel invitation' })
            }).append($('<i>', { class: 'bi bi-x-lg', 'aria-hidden': 'true' }))
                .on('click', () => y.invitationsent.cancelInvitation(id));
        }

        y.invitationutils.renderInvitesGraphic = function (mode, invitations, options) {
            const sent = mode === 'waiting'
                ? (invitations || []).filter(invite => sentIds.has(String(invite.id))) : [];
            if (!sent.length) return originalGraphic.call(this, mode, invitations, options);

            // Reuse BOTH native card factories inside the waiting carousel. This
            // preserves sent-specific details, popovers, and its Cancel action.
            const renderCarousel = y.gameslobby.renderGenericCarousel;
            let sentCard;
            y.gameslobby.renderGenericCarousel = function (selector, items, renderCard) {
                if (selector === '#sentInvitesCarousel') { sentCard = renderCard; return; }
                if (selector === '#waitingInvitesCarousel' && sentCard) {
                    return renderCarousel.call(this, selector, items, (invite, active) =>
                        (sentIds.has(String(invite.id)) ? sentCard : renderCard)(invite, active));
                }
                return renderCarousel.call(this, selector, items, renderCard);
            };
            try {
                originalGraphic.call(this, 'sent', sent, {
                    buttonRenderer: invite => $('<div>', { class: 'invite-button-group d-flex flex-wrap gap-2' })
                        .append(cancelButton(invite.id))
                });
                return originalGraphic.call(this, mode, invitations, options);
            } finally {
                y.gameslobby.renderGenericCarousel = renderCarousel;
            }
        };

        // DataTables redraws for paging, search, sorting, and refreshed data.
        // Change only the action for sent invitations; keep every native column.
        $('#waitingInvitesTable').on('draw.dt.mergedInvitations', function () {
            $(this).find('.received-invite-details').each(function () {
                const id = this.dataset.inviteId;
                if (sentIds.has(String(id))) {
                    // Sent payloads omit the creator from players, so the waiting
                    // occupancy label would undercount. Native sent rows omit it.
                    $(this).closest('tr').find('td > .small.text-muted.mb-1').remove();
                    $(this).replaceWith(cancelButton(id));
                }
            });
        });

        const sentSection = document.getElementById('sentInvitesSection')?.closest('section');
        if (sentSection) {
            const style = document.createElement('style');
            sentSection.classList.add('yucata-merged-sent-source');
            style.textContent = '.yucata-merged-sent-source { display: none !important; }';
            document.head.append(style);
        }
        // Also handles installation after the lobby has already rendered.
        refresh();
        return true;
    }

    if (!document.getElementById('waitingInvitesSection')) return;
    if (install()) return;
    // The page may finish initializing its scripts after document-end.
    let attempts = 0;
    const timer = setInterval(() => {
        if (install() || ++attempts >= 150) clearInterval(timer);
    }, 100);
})();
