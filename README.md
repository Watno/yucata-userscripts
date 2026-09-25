# Yucata userscripts

Small, optional Tampermonkey scripts for [Yucata](https://www.yucata.de/). Install either script independently.

## Script catalog

| Script | What it does | Install | Source |
| --- | --- | --- | --- |
| Private chat: Enter to send | Enter sends private lobby messages; Shift+Enter inserts a line break. Public chat keeps its existing behavior. | [Install](https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-lobby-chat-enter.user.js) | [View](scripts/yucata-lobby-chat-enter.user.js) |
| Always show forum link | Keeps the forum link visible in the top bar, including when there are no unread messages. The unread badge still appears when needed. | [Install](https://raw.githubusercontent.com/Watno/yucata-userscripts/main/scripts/yucata-always-show-forum.user.js) | [View](scripts/yucata-always-show-forum.user.js) |

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) for your browser.
2. Click **Install** next to the script you want.
3. Review the script in Tampermonkey and confirm installation.
4. Reload Yucata.

If the link displays source code instead of opening Tampermonkey, open the Tampermonkey dashboard, choose **Utilities → Install from URL**, and paste the Install link.

Already using the earlier copy-and-paste versions? Install from the links above once to get the update URLs. The script names and namespaces are unchanged so Tampermonkey can identify the existing scripts. If you previously renamed a script, disable or remove that older copy.

## Updates

Each script has its own version, a small `.meta.js` update file, and a `.user.js` download URL. Tampermonkey checks for newer versions according to your update settings. You can also check for updates manually in its dashboard. Newly added catalog entries are not installed automatically.

This README is the catalog. There is no custom feed that you need to subscribe to. The scripts use Tampermonkey's documented [userscript metadata](https://www.tampermonkey.net/documentation.php?locale=en). Its [JSON provisioning format](https://www.tampermonkey.net/documentation.php?locale=en&q=deploying) is intended for managed browser deployments.

## Scope and permissions

Both scripts run only on `yucata.de` and its subdomains. They do not collect data or add network requests; Tampermonkey handles update checks against GitHub. The forum script requests `GM_addStyle` to add its CSS. The chat script uses the existing Yucata Send button.

The chat script preserves Shift+Enter, existing modified-Enter shortcuts, and mention/emoji selection. It ignores held-key repeats and avoids sending when Enter confirms IME composition.

These are unofficial, independent customizations. Yucata interface changes may require script updates. Report problems through [GitHub Issues](https://github.com/Watno/yucata-userscripts/issues).

## Maintaining the catalog

- Edit the relevant file in `scripts/` and increment its `@version`.
- Copy its complete userscript header to the matching `.meta.js` file.
- Keep the install, homepage, and support URLs current.
- Update this catalog and `CHANGELOG.md` when adding or changing a script.
- Check JavaScript syntax and verify behavior on Yucata before publishing.

## License

[MIT](LICENSE).
