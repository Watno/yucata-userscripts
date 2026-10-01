# Pending invitation tests

Run the dependency-free regression tests with:

```powershell
node --test tests/merge-pending-invitations.test.cjs
```

For visual testing on the local Yucata instance, copy `native-lobby-preview.html` to the local web root as `pending-invitations-userscript-test.html`, and copy `scripts/yucata-merge-pending-invitations.user.js` alongside it as `pending-invitations-userscript-test.js`. Open `http://localhost:50116/pending-invitations-userscript-test.html` while signed in locally. The test page embeds the real lobby and loads the userscript into it; no lobby source changes are needed.

The Data selector offers the actual local invitations and browser-only fixtures for both groups, either group alone, and both empty. The fixtures use the real page, styles, carousel, and table. Fixture cancellation is simulated locally, and other fixture invitation mutations are blocked. Actual-data mode retains real invitation actions.

Check tile size, carousel navigation, the shared count/toggle, table sorting and pagination, and the different View/Cancel actions. Enable **Update without reload** after loading a fixture to test empty-to-populated transitions. Delete the two temporary web-root copies when finished.
