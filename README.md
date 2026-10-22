# Yahoo Mail Classic Fix

A small browser add-on script that makes Yahoo Mail easy to read again:

- **Unread mail is unmistakable.** In light mode, unread rows get a light purple tint, a purple bar on the left edge, bold text, and an UNREAD label. In dark mode, unread rows become a pale strip with dark text, while read rows stay normal dark. No more squinting at bold-vs-not-quite-bold.
- **Read mail looks finished.** Muted background and normal weight, so your eye skips right past it.
- **Ads are gone.** The ad panel on the right, the sponsored rows mixed into the inbox, and the storage upsell banner are hidden, and the message list uses the full width. No empty gaps left behind.

## Install (one time, about 2 minutes)

1. Install the free **Tampermonkey** extension in your browser:
   - Chrome / Edge: https://www.tampermonkey.net (pick your browser, then "Add to Chrome")
   - Firefox: search "Tampermonkey" in Firefox Add-ons
2. Click this install link and choose **Install** on the Tampermonkey screen that opens:
   **https://raw.githubusercontent.com/CryptoCode14/yahoo-mail-classic-fix/main/yahoo-mail-classic.user.js**
3. Reload Yahoo Mail. That's it.

Want to see it before installing? Open `preview.html` in this repo — it shows light and dark before/after with made-up example emails.

## Updates

You do not need to reinstall anything when the script is improved. Westin publishes new versions to this page, and Tampermonkey checks here for updates on its own. If Tampermonkey shows a notice that an update is available, click **Update** and reload Yahoo Mail.

(One setting makes updates fully hands-off: Tampermonkey icon → Dashboard → Settings → under "Script Updates", set "Check Interval" to Daily and check "Auto update scripts". Optional — the update prompt works fine without it.)

## If something looks wrong

Tell Westin what you see (a screenshot helps). Known quirks:

- Yahoo occasionally changes its page layout, which can break a cosmetic fix like this until the script is updated.
- The fix only changes how mail *looks*. It never reads, sends, moves, or deletes any mail.

## Turning it off

Tampermonkey icon → find "Yahoo Mail Classic Fix" → flip its switch off, then reload Yahoo Mail. To remove it completely, open the Tampermonkey Dashboard and delete the script.
