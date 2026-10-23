# Yahoo Mail Classic Fix

I built this because Yahoo Mail makes unread messages almost impossible to spot. Read and unread look nearly identical, the few cues that exist are subtle, and people miss mail because of it. I originally made this for a family member who relies on Yahoo Mail every day and dislikes interface changes — it keeps Yahoo looking like Yahoo, just readable.

It's a Tampermonkey userscript. It changes how Yahoo Mail looks and behaves in your browser; it never reads, sends, moves, or deletes your mail, and everything it stores stays in your browser.

## What it does

- **Unread mail you can actually see.** Unread messages stand out with a tinted row, a colored edge bar, bold text, and an UNREAD pill, in both light and dark mode. Read mail stays muted, so your eye skips past it.
- **An Unread Style page inside Yahoo's own Settings.** Open Yahoo Settings (the gear) and there's an extra item in the settings sidebar: **Unread style**. It offers 12 built-in treatments — modeled on how Outlook, Gmail, and Yahoo itself handle unread mail — plus a fully custom mode, all with a live preview. Changes apply instantly and save on your computer.
- **A global accent color.** One picker recolors all of Yahoo's purple — buttons, icons, hovers, badges, Yahoo's own chrome included — in both themes. Identity colors (sender avatars, mailbox avatars) are never touched, and one click restores Yahoo purple.
- **Emails to Myself, without Mail Plus.** Yahoo locks its Emails to Myself tab behind the paid Mail Plus tier. This script takes the tab over and instead runs a Yahoo search for mail from and to your own address — the same list, no subscription. (Actual Mail Plus features can't be unlocked by any script; entitlement is checked on Yahoo's servers. This replaces the one feature with a search that does the same job.)
- **An unread count where you can see it.** A badge on the Inbox icon shows Yahoo's own unread total, capped at 99+ and gone when you're caught up. The Unread view is also promoted into the main folder rail instead of hiding in the ••• menu, with no number of its own — the count lives on Inbox.
- **No ads, no upsells.** Ad panels, sponsored rows in the list, and Mail Plus pitch cards are hidden, and the message list uses the full width.
- **A cleaner folder rail.** A modern skin for the expanded folder list, designed separately for dark and light mode, with the light version following your accent color.

## Install (one time, about 2 minutes)

1. Install the free **Tampermonkey** extension in your browser:
   - Chrome / Edge: https://www.tampermonkey.net (pick your browser, then "Add to Chrome")
   - Firefox: search "Tampermonkey" in Firefox Add-ons
2. Click this install link and choose **Install** on the Tampermonkey screen that opens:
   **https://raw.githubusercontent.com/CryptoCode14/yahoo-mail-classic-fix/main/yahoo-mail-classic.user.js**
3. Reload Yahoo Mail. That's it.

Want to see it before installing? Open `preview.html` in this repo — it shows light and dark before/after with made-up example emails.

## Using it

- **Change styles:** Yahoo's gear icon → **Unread style** in the settings sidebar.
- **Emails to Myself:** open the **Sent** folder and click the **Emails to Myself** tab. The script detects your email address automatically; if it's ever wrong, you can type it under Settings → Unread style → Emails to Myself.
- **Everything is optional and reversible.** Reset the accent with the "Yahoo purple" button; turn the script off any time from the Tampermonkey icon.

## Updates

You don't need to reinstall anything. Tampermonkey checks this page for updates on its own; when one is available, accept it and reload Yahoo Mail.

One setting makes updates fully hands-off: Tampermonkey icon → Dashboard → Settings → under "Script Updates", set "Check Interval" to Daily and check "Auto update scripts". Optional — the update prompt works fine without it.

## Privacy

The script runs entirely in your browser and makes no network requests of its own. Your style settings live in your browser's local storage. Nothing is collected or sent anywhere.

## If something looks wrong

Open an issue with a screenshot. Known quirks:

- Yahoo occasionally changes its page layout, which can break a cosmetic script like this until it's updated.
- The script only changes how mail *looks* and how a few buttons behave. Your mail itself is untouched.

## Turning it off

Tampermonkey icon → find "Yahoo Mail Classic Fix" → flip its switch off, then reload Yahoo Mail. To remove it completely, open the Tampermonkey Dashboard and delete the script.
