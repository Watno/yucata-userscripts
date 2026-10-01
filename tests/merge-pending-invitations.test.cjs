const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../scripts/yucata-merge-pending-invitations.user.js'), 'utf8');

function setup(waitingItems = [], sentItems = []) {
    const state = { waitingItems, sentItems, calls: [], timers: new Map(), renders: [], handlers: {}, styles: [], refreshed: 0 };
    const waiting = { dataset: {} };
    const section = { classList: { add: name => { state.hiddenClass = name; } } };
    const document = {
        getElementById: id => id === 'waitingInvitesSection' ? waiting : id === 'sentInvitesSection' ? { closest: () => section } : null,
        createElement: () => ({}), head: { append: style => state.styles.push(style.textContent) }
    };
    function $(selector, attrs) {
        return { selector, attrs, children: [], events: {},
            append(child) { this.children.push(child); return this; },
            on(event, callback) { this.events[event] = callback; state.handlers[event] = callback; return this; }
        };
    }
    const api = { async fetch(url, options, ...rest) {
        assert.equal(this, api, 'preserve API receiver');
        state.calls.push({url,options,rest});
        if (state.fail === url) throw new Error('API failed');
        if (url === '/api/me/invitations/waiting') return state.waitingItems;
        if (url === '/api/me/invitations/sent') return state.sentItems;
        return { ok: true };
    } };
    const y = {
        base: { api },
        gameslobby: { renderGenericCarousel(selector, items, renderCard) {
            if (state.renderError) throw new Error('render failed');
            state.renders.push({selector,cards: items.map(item => renderCard(item, true))});
        } },
        invitationutils: { renderInvitesGraphic(mode, items, options) {
            if (!items?.length) return;
            y.gameslobby.renderGenericCarousel(`#${mode}InvitesCarousel`, items, item => ({
                mode, item, action: mode === 'sent' ? options.buttonRenderer(item) : 'View'
            }));
        } },
        invitationlobby: { loadWaitingInvitations() { state.refreshed++; } },
        invitationsent: { cancelInvitation(id) { state.cancelled = id; } }
    };
    state.originalCarousel = y.gameslobby.renderGenericCarousel;
    const context = vm.createContext({
        document, window: { y$: y, jQuery: $, i18next: { t: (key, opts) => opts.defaultValue } },
        setTimeout: fn => { const key = {}; state.timers.set(key, fn); return key; },
        clearTimeout: key => state.timers.delete(key), setInterval() { throw new Error('unexpected delayed initialization'); }
    });
    vm.runInContext(source, context);
    state.timers.clear();
    return { state, y, context, waiting };
}

for (const [waiting, sent] of [[[1],[2]], [[1],[]], [[],[2]], [[],[]]]) {
    test(`merge waiting=${waiting.length}, sent=${sent.length}`, async () => {
        const { y } = setup(waiting.map(id => ({id})), sent.map(id => ({id})));
        const result = await y.base.api.fetch('/api/me/invitations/waiting');
        assert.deepEqual(Array.from(result, x => x.id), [...waiting,...sent]);
    });
}
test('deduplicates IDs, preferring sent data even with differing ID types', async () => {
    const { y } = setup([{id: 1, old: true}], [{id:'1', own: true}]);
    const result = await y.base.api.fetch('/api/me/invitations/waiting');
    assert.equal(result.length, 1);
    assert.equal(result[0].own, true);
});
test('uses both native factories in the original waiting carousel', async () => {
    const { y, state } = setup([{id:1}], [{id:2}]);
    const result = await y.base.api.fetch('/api/me/invitations/waiting');
    y.invitationutils.renderInvitesGraphic('waiting', result, {});
    assert.equal(state.renders.length, 1);
    assert.equal(state.renders[0].selector, '#waitingInvitesCarousel');
    assert.deepEqual(Array.from(state.renders[0].cards, card => card.mode), ['waiting','sent']);
    const cancel = state.renders[0].cards[1].action.children[0];
    cancel.events.click();
    assert.equal(state.cancelled, 2);
    assert.equal(y.gameslobby.renderGenericCarousel, state.originalCarousel);
});
test('restores native carousel function if rendering fails', async () => {
    const { y, state } = setup([], [{id:2}]);
    const result = await y.base.api.fetch('/api/me/invitations/waiting');
    state.renderError = true;
    assert.throws(() => y.invitationutils.renderInvitesGraphic('waiting', result, {}), /render failed/);
    assert.equal(y.gameslobby.renderGenericCarousel, state.originalCarousel);
});
test('refreshes after successful mutations, preserving failures', async () => {
    const { y, state } = setup();
    await y.base.api.fetch('/api/invitations/2', {method:'DELETE'});
    assert.equal(state.timers.size, 1);
    for (const fn of state.timers.values()) fn();
    assert.equal(state.refreshed, 1);
    state.timers.clear();
    state.fail = '/api/invitations/3';
    await assert.rejects(y.base.api.fetch(state.fail, {method:'DELETE'}), /API failed/);
    assert.equal(state.timers.size, 0);
});
test('passes unrelated API calls through unchanged', async () => {
    const { y, state } = setup();
    const options = {method:'GET',signal:'signal'};
    assert.deepEqual(await y.base.api.fetch('/api/other',options,'extra'), {ok:true});
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0].options, options);
    assert.deepEqual(state.calls[0].rest, ['extra']);
});
test('reinstallation does not wrap the API twice or create replacement UI', () => {
    const { y, state, context, waiting } = setup();
    const fetch = y.base.api.fetch;
    vm.runInContext(source, context);
    assert.equal(y.base.api.fetch, fetch);
    assert.equal(waiting.dataset.mergedSentInvitations, 'true');
    assert.equal(state.styles.length, 1);
    assert.equal(state.styles[0], '.yucata-merged-sent-source { display: none !important; }');
});
