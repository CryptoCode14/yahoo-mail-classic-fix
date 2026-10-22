// ==UserScript==
// @name         Yahoo Mail Classic Fix - Unread You Can Actually See + No Ads
// @namespace    grandvalley.yahoomailfix
// @version      3.4.1
// @description  Makes unread mail unmistakable (whole-row tint + purple left bar + bold, in light AND dark mode), mutes read mail, hides ads including sponsored rows inside the list, puts a clean unread-count badge on the Inbox nav icon, and brings back the old Yahoo Mail Classic list feel. Works on mail.yahoo.com.
// @author       Gus for Westin
// @match        https://mail.yahoo.com/*
// @match        https://*.mail.yahoo.com/*
// @downloadURL  https://raw.githubusercontent.com/CryptoCode14/yahoo-mail-classic-fix/main/yahoo-mail-classic.user.js
// @updateURL    https://raw.githubusercontent.com/CryptoCode14/yahoo-mail-classic-fix/main/yahoo-mail-classic.user.js
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

/*
  v3.2.0 (same day, Westin's live test of v3.1.1 + screenshot):
  singleton fix held (exactly one tab) and the badge showed, but
  three things were still wrong, all visible in his crop:
  (1) the badge NUMBER WAS CLIPPED at the top - the badge had been
  anchored to an INNER element of Yahoo's tab, inside a pill that
  clips its contents; (2) our inserted tab landed at that same
  wrong inner depth (a stray mini-icon ended up trapped inside
  the Inbox pill, shoving the "Inbox" label down); (3) our own
  tab element looked dim/small next to Yahoo's tabs and clicking
  it did nothing - Westin: "we have to use their unread tab... it
  needs to look exactly like yahoo's original unread icon."
  v3.2.0 fixes the depth and takes his direction literally:
  - Everything nav-related now anchors to the tab's OUTER ROW -
    the direct child of the list that holds Inbox/Sent/Drafts -
    found by climbing from the matched element to the list child
    (railTabOf). The badge wraps the icon inside that row, every
    in-tab ancestor of the icon gets overflow:visible, and the
    badge tucks in (-6px instead of -9px) so nothing clips it.
  - The promoted Unread tab IS Yahoo's own menu element, MOVED
    (transplanted) from the "..." menu into the rail after Inbox:
    their node, their exact icon glyph, their click behaviour -
    we only re-flow it into a column (icon over label, count leaf
    hidden). If Yahoo's item has never been mounted (menu never
    opened), a placeholder stands in; clicking it opens the
    "..." menu (the More control is now searched much more
    broadly, any element in the rail), and the instant Yahoo's
    item appears it is transplanted into the rail AND clicked -
    so the first click already lands on the Unread view, and
    every later click is Yahoo's own tab doing its own job.
  Same version, Westin's follow-ups (13:32 MDT): (a) Mail Plus -
  he asked to "unlock all the mail plus features and get rid of
  those buttons". The buttons go: hideUpsells removes Go ad-free /
  Try Mail Plus CTAs, the Yahoo Mail Plus menu entry, and paywall
  empty-state cards. The unlock does NOT happen, and cannot: Plus
  entitlement is checked on Yahoo's servers before the feature is
  served, so no page script can grant it - anyone's script that
  claims otherwise is hiding the sign, not opening the door.
  (b) Ads still showing on the Drafts page: ad cleanup broadened
  beyond the inbox - leaderboard/Taboola/GPT/right-rail slots are
  now tagged by name on every view, and the iframe net widened.

  v3.1.1 (same day, Westin's live test of v3.1.0): the badge worked
  (his screenshot shows the purple "2" on the Inbox icon) BUT the
  promoted Unread tab kept multiplying down the rail - dozens of
  identical tabs. Root cause, two flaws in v3.1.0's build: (1) the
  tab was a cloneNode of Yahoo's Inbox tab, so it carried Yahoo's
  own framework classes/attributes and Yahoo's rail code treated
  the clone as one of its own managed children to re-render;
  (2) the "already have one?" check was scoped to a computed rail
  root instead of the whole document, and nothing ever REMOVED a
  duplicate. v3.1.1 rebuilds the promotion defensively: the tab is
  now our own element carrying ONLY gv classes (styled to match
  the rail: icon over label, same soft pill), the script tracks
  the one node it built by identity, every run sweeps away any
  other element carrying our marker anywhere in the document
  (including leftovers from the buggy build), and a runaway brake
  stops re-insertion entirely if Yahoo wipes the tab more than
  3 times in 10 seconds. Exactly one Unread tab can ever exist.

  v3.1.0 (2026-10-22, Westin: "I want the inbox nav icon to show how
  many unread emails there are... professional and clean but still
  noticeable"): NEW - unread-count badge ON the Inbox icon in the
  left folder nav. A small Yahoo-purple (#6001d2, the same purple as
  the UNREAD row pill) pill sits on the icon's top-right corner:
  white bold number, thin ring in the nav's surface colour so it
  separates cleanly from the icon, soft shadow. 1 digit = circle,
  2 digits = pill, over 99 = "99+" (the exact count stays in the
  badge's tooltip). No badge at zero - a clean icon means caught up.
  Same version, Westin's screenshot + follow-up (12:18 MDT): the
  left nav is an ICON RAIL (compose, Inbox, Sent, Drafts, Trash,
  Spam, Folders, then a "..." overflow button), and Yahoo buries
  the Unread view inside that "..." menu, with its own little "2"
  beside it. So v3.1 also MOVES UNREAD UP: a new Unread tab in the
  main icon rail, directly under Inbox, built by cloning Yahoo's
  own Inbox tab so it inherits the rail's real styling, with the
  label swapped to "Unread" and Yahoo's envelope-with-dot glyph.
  Per Westin the promoted tab carries NO number - the count lives
  on the Inbox icon only - and the original Unread entry is hidden
  out of the "..." menu (it has been moved, not duplicated).
  Clicking the rail tab activates Yahoo's REAL Unread menu item
  (its href is harvested and cached the first time the menu is
  seen; if the item is not in the DOM because the menu is closed,
  the click opens the menu and clicks through the instant the item
  appears). The script never guesses the Unread view's URL.
  COUNT SOURCE, in order: (1) the Inbox nav item itself - Yahoo's
  own count leaf / "Inbox (n)" text / an aria-label like "Inbox, 12
  unread" - and when Yahoo shows that count as plain text next to
  the label we hide our copy of it (gv-nav-native-count) so the
  number appears exactly once, on the icon; (2) the document title,
  which Yahoo prefixes with the unread total, e.g. "(12) ...".
  Deliberately NEVER counted: the message rows on screen. The list
  is virtualised, so visible rows are only a window onto the inbox
  and counting them would under-report the real total. If no total
  can be found, no badge is shown rather than a wrong number.
  Per-folder items have no published stable data-test-id (see the
  2026-10-22 selector research), so the Inbox item is found inside
  the known left-rail containers by href / aria-label / link text -
  never by Yahoo's hashed atomic classes.

  v2.0.0 - WHAT WAS WRONG WITH v1 (from Westin's screenshot, 2026-10-22):
  Every row turned purple. Cause: v1 searched ALL descendants of a row for
  the word "unread" - and every row, read or not, contains a hidden action
  button labelled "Mark as unread". Read rows matched it and got tagged
  unread. v2 never reads action-button labels. Unread is now decided the
  way a human decides it (Westin's own rule): the sender/subject/time text
  is BOLD (majority of sampled text in the row), corroborated only by the
  row's own message descriptor - never by toolbar buttons.
  Also fixed: sponsored "Ad" rows inside the list (v1 only looked for them
  among normal message rows and with a too-narrow badge check) are now
  caught by a separate scan of every child of the list container.

  v3.0.0 (same day, Westin: dark mode too grey, purple tint still hard
  to see - "think of a better method"): NEW DARK METHOD. Tinting a
  dark row with another dark color only moved luminance 1.4x, and
  grey-muting read rows made the whole inbox look grey. v3 inverts
  the emphasis: in dark mode UNREAD rows become a pale lavender strip
  with dark text (luminance step 24x, text 11.5:1) while READ rows go
  back to normal soft-white text on Yahoo's dark surface - no grey
  wash anywhere. Strip vs dark row is obvious without relying on hue
  or bold. CONFIG.darkMethod='ring' keeps rows dark instead and adds
  a bright outline ring + deep plum tint. Light mode untouched.

  v2.4.0 (same day, Westin's "ads gone but empty spaces" screenshot):
  Light mode verified fixed in that shot (light tint unread, shaded
  read). Remaining problem: hidden ads left blank row-height bands -
  we were hiding the ad's INNER content while Yahoo's outer list
  wrapper kept reserving the height. v2.4 only ever tags the outermost
  list item (listItemOf) and .gv-ad now annihilates height/padding/
  margin too, so rows close up. Plus a cleanup pass: Yahoo recycles
  list DOM nodes on scroll, so any wrapper whose gv-ad is stale (its
  content is a real message again) sheds the class instead of staying
  a blank. The storage upsell band collapses its wrapper chain too.

  v2.3.0 (same day, Westin's light-mode screenshot):
  Light mode broke because theme DETECTION was lying, not because the
  light palette was wrong: body bg is transparent on Yahoo light and
  v2.2 read it as black, latching the dark palette onto a light UI.
  Detection now samples painted surfaces only (see detectDark). Dark
  palette values are UNCHANGED from v2.2 - per Westin: don't mess with
  dark mode. Light read rows got one researched tweak: the read shade
  is now a cool #eceff3 with #5f6368 text (5.3:1) - Gmail's light
  pattern (unread bright + bold, read recedes onto a shaded surface)
  and Material's 87%/54% primary/secondary text hierarchy. Light
  unread tint/bar/pill unchanged (Material primary-container pattern).

  v2.2.0 (same day, Westin's dark-mode screenshot + ad crop):
  - In-list house ads ("Messages Awaiting - Missed 2 Recent Updates?")
    still slipped past the row scan, so v2.2 hunts the one thing every
    sponsored row must carry: the literal "Ad" disclosure text. A
    TreeWalker finds exact "Ad"/"Sponsored"/"Promoted" text nodes,
    verifies the element is badge-sized, and hides its row ancestor.
  - Dark unread purple replaced per Material dark-theme guidance:
    saturated colors on dark vibrate and strain eyes. #43307a (44% sat)
    -> #38354f (20% sat, muted purple-grey, one elevation step up);
    text pure white -> soft #ededf2 at 10.0:1; saturation kept only in
    the 5px bar (#bb86fc) and the pill (#c4b5fd).
*/

(function () {
  'use strict';

  /* ============================== CONFIG ============================== */
  const CONFIG = {
    hideRightRail: true,     // hide Starred/Contacts/ad rail, list goes full width
    hideSponsoredRows: true, // hide "Ad" rows anywhere in the list, not just the top
    observeChanges: true,
    // Dark-mode method (v3.0): 'strip' = unread rows become a pale
    // lavender strip with dark text on the dark UI (default). 'ring' =
    // rows stay dark but unread gets a bright lavender outline + tint.
    darkMethod: 'strip',
    showInboxBadge: true,    // v3.1: unread-count badge on the Inbox nav icon
    inboxBadgeCap: 99,       // counts above this display as "99+"
    promoteUnread: true,     // v3.1: move Unread out of the "..." menu into the main icon rail (no count on it - the Inbox badge carries the number)
    hideUpsells: true,       // v3.2: hide Mail Plus upsell buttons/prompts (Go ad-free, Try Mail Plus, paywall cards). Cosmetic only - Plus features themselves are checked on Yahoo's servers and cannot be unlocked by a script.
    modernExpandedNav: true, // v3.4: modern skin for the EXPANDED side nav only (hidden scrollbar, pill rows). Scoped to [data-test-id="expanded-left-rail"] - the collapsed rail is never touched by it.
  };

  /* ============================== CSS ============================== */
  const CSS = `
  :root {
    --gv-unread-bg: #e9e2ff;
    --gv-unread-bg-hover: #ddd0ff;
    --gv-unread-fg: #0f0f14;
    --gv-unread-bar: #6001d2;
    --gv-read-bg: #eceff3;
    --gv-read-fg: #5f6368;
    --gv-row-border: #d4d4d8;
    --gv-badge-bg: #6001d2;
    --gv-badge-fg: #ffffff;
    --gv-unread-ring: transparent;
    --gv-nav-badge-ring: #ffffff;
  }
  /* Dark method v3.0 - "pale strip" (Westin: the grey-purple tint was
     both hard to see AND grey/muddy). The numbers said why: the old
     unread bg only stepped luminance 1.4x above the read surface -
     in dark UIs hierarchy is carried by LUMINANCE, and 1.4x at the
     dark end is nearly nothing. So stop tinting dark-on-dark:
     - UNREAD becomes a pale lavender strip (#dbd4f0, luminance
       0.68 = a 24x step over the read surface) with DARK plum text
       (#211b36, 11.5:1). Light strip vs dark row is a binary,
       glanceable difference that does not depend on hue at all,
       and dark-on-light is the polarity eyes read easiest. The
       strip is a soft pastel (89% lightness), not pure white, so
       it reads like paper, not a glare. Bar + pill go deep Yahoo
       purple #6001d2, which pops on the pale strip (6.0:1 / 8.6:1).
     - READ stops being greyed out (that was the "grayness"): text
       returns to a normal soft white #e4e4e9 (10.7:1 on Yahoo's
       dark surface) at regular weight. Read looks like normal
       mail again - it just isn't highlighted.
     CONFIG.darkMethod 'ring' swaps in the stay-dark alternative:
     deep plum bg + a 2px #bb86fc outline ring around unread rows. */
  html.gv-dark {
    --gv-unread-bg: #dbd4f0;
    --gv-unread-bg-hover: #e6e1f7;
    --gv-unread-fg: #211b36;
    --gv-unread-bar: #6001d2;
    --gv-unread-ring: transparent;
    --gv-read-bg: transparent;
    --gv-read-fg: #e4e4e9;
    --gv-row-border: #3a3a41;
    --gv-badge-bg: #6001d2;
    --gv-badge-fg: #ffffff;
    --gv-nav-badge-ring: #1c1c21;
  }
  html.gv-dark.gv-ring {
    --gv-unread-bg: #2b2640;
    --gv-unread-bg-hover: #332d4c;
    --gv-unread-fg: #f4f2fa;
    --gv-unread-bar: #bb86fc;
    --gv-unread-ring: #bb86fc;
    --gv-badge-bg: #bb86fc;
    --gv-badge-fg: #241738;
  }

  .gv-row {
    font-family: Arial, Helvetica, sans-serif !important;
    border-bottom: 1px solid var(--gv-row-border) !important;
  }

  /* UNREAD */
  .gv-unread {
    background-color: var(--gv-unread-bg) !important;
    box-shadow: inset 5px 0 0 0 var(--gv-unread-bar),
                inset 0 0 0 2px var(--gv-unread-ring, transparent) !important;
  }
  .gv-unread:hover { background-color: var(--gv-unread-bg-hover) !important; }
  .gv-unread, .gv-unread * { color: var(--gv-unread-fg) !important; }
  .gv-unread { font-weight: 700 !important; }
  .gv-unread [data-test-id*="snippet" i],
  .gv-unread [data-test-id*="preview" i] { font-weight: 400 !important; opacity: 0.85; }

  .gv-badge {
    flex: none !important;
    align-self: center;
    display: inline-block !important;
    background: var(--gv-badge-bg) !important;
    color: var(--gv-badge-fg) !important;
    font: 700 9px/1 Arial, Helvetica, sans-serif !important;
    letter-spacing: 0.06em;
    padding: 3px 5px !important;
    border-radius: 3px;
    margin-left: 8px;
    vertical-align: middle;
    pointer-events: none;
    white-space: nowrap;
  }

  /* FOLDER CHIP inside an unread row (v3.4.1): Yahoo's folder tag
     ("Inbox", "Sent", ...) is a dark pill with light letters. The
     unread strip forces the strip's dark text colour on EVERY
     descendant, which erased the chip's letters - the pill rendered
     as a big black mark (Westin live report 2026-10-22; probe
     confirmed the leaf computing to the strip colour on a
     rgb(19,19,19) parent). tagRowChips() tags such pills with
     .gv-row-chip (detected by computed background, never by
     Yahoo's hashed classes); this rule restores light letters on
     the pill while the pill keeps Yahoo's own dark background. */
  .gv-unread .gv-row-chip,
  .gv-unread .gv-row-chip * { color: #ffffff !important; }

  /* INBOX NAV BADGE (v3.1) - the unread count, on the Inbox icon in
     the left folder nav. Design notes: Yahoo purple is the brand
     signal this script already uses for unread (row bar + UNREAD
     pill), so the badge reads as "unread" without shouting like an
     alarm-red dot; it stays noticeable because of placement (it
     breaks the icon's outline at its top-right corner), the white
     bold numeral, and a 2px ring in the nav surface colour plus a
     soft shadow, which lift it off any icon in light AND dark navs.
     Absolutely positioned, so the nav layout never shifts. */
  /* INBOX NAV BADGE host (v3.3): the badge is a child of the
     tab's ROW (the li), positioned by measured offsets at the
     button's top-right corner. Yahoo's button internals are never
     wrapped, moved or added to - v3.1/v3.2 wrapped the svg, which
     broke Yahoo's show/hide CSS for the tab's two state icons and
     BOTH rendered at once (Westin's "stacked icons", 2026-10-22,
     confirmed in his real rail DOM dump). */
  .gv-badge-host {
    position: relative !important;
  }
  /* Promoted Unread rail tab (v3.3): a sanitized clone of Yahoo's
     own Inbox li - their structure and classes, so it looks
     exactly like their tabs - re-glyphed with Yahoo's own Unread
     path data. Yahoo's nodes are never moved or transplanted:
     the menu item is React-owned, and moving it corrupted the
     rail in v3.2. Clicking the clone clicks Yahoo's real menu
     item by its stable id (see activateUnread). */
  .gv-unread-tab {
    cursor: pointer !important;
  }
  .gv-unread-tab-active {
    font-weight: 700 !important;
  }
  .gv-nav-badge {
    position: absolute !important;
    z-index: 6 !important;
    box-sizing: border-box !important;
    min-width: 18px !important;
    height: 18px !important;
    padding: 0 5px !important;
    border-radius: 999px !important;
    background: var(--gv-badge-bg) !important;
    color: var(--gv-badge-fg) !important;
    font: 700 11px/18px Arial, Helvetica, sans-serif !important;
    letter-spacing: 0 !important;
    text-align: center !important;
    white-space: nowrap !important;
    pointer-events: none !important;
    box-shadow: 0 0 0 2px var(--gv-nav-badge-ring),
                0 1px 4px rgba(0, 0, 0, 0.35) !important;
  }
  /* "99+" needs the same height in a slightly smaller numeral. */
  .gv-nav-badge.gv-nav-badge-capped {
    font-size: 10px !important;
    padding: 0 4px !important;
  }
  /* Fallback when no icon-sized holder exists in the item: anchor
     the badge to the item's own top-left, beside where the icon
     would be, instead of floating it over the label text. */
  /* Yahoo's own plain-text count next to the Inbox label: hidden
     ONLY once our badge is showing the same number on the icon, so
     the count is never displayed twice. */
  .gv-nav-native-count {
    display: none !important;
  }
  /* Unread in the nav also bolds the Inbox label - the Classic
     folder pane did exactly this (Inbox (n), bold). */
  .gv-nav-has-unread {
    font-weight: 700 !important;
  }

  /* READ */
  .gv-read {
    background-color: var(--gv-read-bg) !important;
    box-shadow: none !important;
    font-weight: 400 !important;
  }
  .gv-read, .gv-read * { color: var(--gv-read-fg) !important; }

  /* ADS - v2.4: display:none alone left blank row-height bands, because
     Yahoo's list wrapper (the element holding the row's height) stayed
     behind after its inner ad content was hidden. .gv-ad is now only
     ever put on the OUTERMOST list item (see listItemOf) and the rule
     annihilates the box as well as hiding it, so following rows close
     up instead of leaving a gap. */
  .gv-ad {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    border: 0 !important;
    overflow: hidden !important;
  }
  iframe[src*="doubleclick" i], iframe[src*="googlesyndication" i],
  iframe[src*="amazon-adsystem" i], iframe[src*="ads.yahoo" i],
  iframe[title*="advertis" i], [aria-label="Advertisement" i] {
    display: none !important;
  }
  .gv-right-rail iframe, .gv-right-rail [aria-label="Advertisement" i] { display: none !important; }
  html.gv-hide-rail .gv-right-rail { display: none !important; }
  .gv-upsell {
    display: none !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    border: 0 !important;
    overflow: hidden !important;
  }
  /* EXPANDED NAV MODERN SKIN (v3.4) - every selector is fenced
     under html.gv-modern-expanded AND the expanded container, so
     the collapsed icon rail (a different container, confirmed
     good by Weston 2026-10-22 - "do not mess with it") cannot be
     affected by any rule here. Treatment: the folder list keeps
     scrolling but its scrollbar is hidden, freeing the width the
     bar ate; rows become inset rounded pills with a soft hover;
     the current folder gets a filled purple-tint pill with a
     purple edge bar; Yahoo's own count badge (which exists only
     in this mode) is recoloured to the same Yahoo purple as the
     collapsed badge, so the count reads once and on brand. */
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="navigable-list"] {
    scrollbar-width: none !important;
    -ms-overflow-style: none !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="navigable-list"]::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="navigable-list"] > li {
    padding: 1px 8px !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"] {
    border-radius: 10px !important;
    transition: background-color 120ms ease !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:hover {
    background-color: rgba(148, 148, 175, 0.14) !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) {
    background-color: rgba(124, 77, 255, 0.20) !important;
    box-shadow: inset 3px 0 0 0 #6001d2 !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) a {
    font-weight: 700 !important;
  }
  html.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="badge"] > span {
    background-color: #6001d2 !important;
    color: #ffffff !important;
    border-radius: 999px !important;
    padding: 1px 8px !important;
    font-weight: 700 !important;
  }
  `;

  /* ============================== ROW FINDING ============================== */
  const ROW_SELECTORS = [
    '[data-test-id="message-list-item"]',
    '[data-test-id*="message-list-item" i]',
    '[data-testid="message-list-item"]',
    'li[data-test-id*="message" i]',
    '[role="listitem"][data-test-id]',
    '[role="option"][data-test-id]',
  ];

  function findRows() {
    const seen = new Set();
    const rows = [];
    for (const sel of ROW_SELECTORS) {
      document.querySelectorAll(sel).forEach((el) => {
        if (!seen.has(el)) { seen.add(el); rows.push(el); }
      });
    }
    if (rows.length) return rows;
    document.querySelectorAll('li, [role="listitem"], [role="option"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.height >= 28 && r.height <= 110 && r.width >= 320 &&
          el.querySelector('input[type="checkbox"]')) rows.push(el);
    });
    return rows;
  }

  /* ============ OUTERMOST LIST ITEM (the height-holder) ============
     Yahoo wraps each message in nested boxes; only the outermost one -
     the direct child of the list container - actually reserves the
     row's height. Hiding anything inside it leaves a blank band.
     listItemOf climbs to that box (stopping before anything tall).   */
  function isListContainer(p) {
    if (!p || p === document.body) return true;
    const role = p.getAttribute && p.getAttribute('role');
    if (role === 'list' || role === 'listbox') return true;
    if (p.children && p.children.length >= 3) {
      let rowKids = 0;
      for (const k of p.children) {
        if (!k.querySelector) continue;
        if (k.querySelector('[data-test-id*="message-list-item" i]')) rowKids++;
        else if (/message-list-item/i.test((k.getAttribute && k.getAttribute('data-test-id')) || '')) rowKids++;
      }
      if (rowKids >= 2) return true;
      const cs = getComputedStyle(p);
      if (cs.overflowY === 'auto' || cs.overflowY === 'scroll') return true;
    }
    return false;
  }

  function listItemOf(el) {
    let item = el;
    for (let i = 0; i < 10 && item.parentElement; i++) {
      if (isListContainer(item.parentElement)) break;
      const parentH = item.parentElement.getBoundingClientRect().height;
      if (parentH > 220) break; // never climb into page-level layout
      item = item.parentElement;
    }
    return item;
  }

  /* ================= UNREAD DETECTION (v2 - read this) =================
     Signals, in order. Deliberately NOT used: any descendant aria-label /
     title / class — rows carry hidden "Mark as unread" / "Mark as read"
     toolbar buttons whose labels poisoned v1.                              */

  // 1) The row's OWN descriptor, or a long message-describing label.
  //    Short labels are actions ("Mark as unread" is 14 chars) and are
  //    ignored on purpose.
  function descriptorSaysUnread(row) {
    const candidates = [row];
    row.querySelectorAll('[aria-label]').forEach((el) => {
      const label = el.getAttribute('aria-label') || '';
      if (label.length > 40) candidates.push(el); // describes a message, not a button
    });
    for (const el of candidates) {
      const label = el.getAttribute && (el.getAttribute('aria-label') || '');
      if (!label || /mark as/i.test(label)) continue;
      if (/^\s*unread\b/i.test(label)) return true;
      if (/,\s*unread[.,\s]/i.test(label)) return true;
      const tid = el.getAttribute && (el.getAttribute('data-test-id') || '');
      if (/(^|[-_])unread([-_]|$)/i.test(tid)) return true;
    }
    return false;
  }

  // 2) Core-field bold: sample leaf text elements with real text (>= 4
  //    chars), skipping anything inside a small toolbar button. In stock
  //    Yahoo an unread row paints sender + subject + time bold; a read row
  //    paints none of them bold. Our own gv classes are stripped before
  //    sampling so we read Yahoo's weights, not ours.
  function boldMajority(row) {
    const badge = row.querySelector('.gv-badge');
    if (badge) badge.remove();
    const hadU = row.classList.contains('gv-unread');
    const hadR = row.classList.contains('gv-read');
    row.classList.remove('gv-unread', 'gv-read');

    const sampled = []; // {text, bold, left} in DOM order
    const leaves = row.querySelectorAll('span, div, time, td, a');
    for (const el of leaves) {
      // leaf-most only: no element child that itself carries text
      let hasTextChild = false;
      for (const c of el.children) {
        if ((c.textContent || '').trim().length >= 2) { hasTextChild = true; break; }
      }
      if (hasTextChild) continue;
      const direct = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim()).join(' ');
      if (direct.length < 4) continue;
      const btn = el.closest('button');
      if (btn && btn.getBoundingClientRect().width < 180) continue; // toolbar action
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const w = parseInt(cs.fontWeight, 10);
      const isBold = (!isNaN(w) && w >= 600) || cs.fontWeight === 'bold';
      sampled.push({ text: direct, bold: isBold, left: r.left });
      if (sampled.length >= 14) break;
    }

    if (hadU) row.classList.add('gv-unread');
    if (hadR) row.classList.add('gv-read');

    if (!sampled.length) return null; // inconclusive

    // Core-field rule (how stock Yahoo actually paints it): an unread row
    // bolds the sender, subject and time; a read row bolds NONE of them.
    // Judging the whole row by majority fails because long regular-weight
    // snippets outnumber the core fields - so judge the core fields:
    // the first three text leaves (sender / subject area), any time-or-date
    // leaf, and the leftmost short leaf (the sender).
    const timeRe = /^\d{1,2}:\d{2}\s?(AM|PM)$|^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$|^Yesterday$|^Today$/i;
    const core = new Set(sampled.slice(0, 3));
    sampled.forEach((s) => { if (timeRe.test(s.text)) core.add(s); });
    const rowLeft = row.getBoundingClientRect().left;
    const senderLeaf = sampled
      .filter((s) => s.text.length <= 40 && !timeRe.test(s.text) && s.left - rowLeft < 300)
      .sort((a, b) => a.left - b.left)[0];
    if (senderLeaf) core.add(senderLeaf);

    if ([...core].some((s) => s.bold)) return true;
    // Secondary: almost everything sampled is bold.
    const boldCount = sampled.filter((s) => s.bold).length;
    if (boldCount / sampled.length >= 0.66) return true;
    return false;
  }

  // 3) Tiebreaker only: a small, visible, filled dot in the left edge.
  function visibleDot(row) {
    const rowR = row.getBoundingClientRect();
    for (const el of row.querySelectorAll('span, div, i, svg')) {
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.width > 16 || r.height < 4 || r.height > 16) continue;
      if (r.left - rowR.left > 80) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const bg = cs.backgroundColor;
      if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') return true;
    }
    return false;
  }

  function isUnreadRow(row) {
    if (descriptorSaysUnread(row)) return true;
    const b = boldMajority(row);
    if (b !== null) return b;
    return visibleDot(row);
  }

  /* ============================== AD ROWS ============================== */
  // Sponsored rows are siblings of message rows inside the list container,
  // not normal message rows - scan the container's children directly.
  function isAdRow(el) {
    const own = (el.getAttribute('aria-label') || '') + ' ' +
                (el.getAttribute('data-test-id') || '');
    if (/\b(sponsored|promoted|advertisement)\b/i.test(own)) return true;
    // Small badge leaf at the left of the row reading Ad / Sponsored / Promoted.
    const rowR = el.getBoundingClientRect();
    for (const leaf of el.querySelectorAll('*')) {
      if (leaf.children.length) continue;
      const t = (leaf.textContent || '').trim();
      if (!/^(Ad|Sponsored|Promoted)$/i.test(t)) continue;
      const r = leaf.getBoundingClientRect();
      if (r.width > 0 && r.width <= 72 && r.height <= 30 &&
          r.left - rowR.left <= 140) return true;
    }
    return false;
  }

  function tagAdRows(rows) {
    const containers = new Set();
    rows.forEach((r) => { if (r.parentElement) containers.add(r.parentElement); });
    const candidates = new Set(rows);
    containers.forEach((c) => Array.from(c.children).forEach((ch) => candidates.add(ch)));
    candidates.forEach((el) => {
      if (isAdRow(el)) listItemOf(el).classList.add('gv-ad');
    });
  }

  // House/promo rows that imitate mail (e.g. "Messages Awaiting") are not
  // siblings the row scan can rely on. Every sponsored row must carry the
  // literal disclosure text "Ad" - hunt the text node itself, verify it
  // sits in a badge-sized element, then hide the row-sized ancestor.
  // Guards: never hide the whole list (height cap + inner-row count), and
  // never hide body text (a paragraph reading "Ad" is not badge-sized).
  function hideBadgeAdRows() {
    if (!CONFIG.hideSponsoredRows || !document.body) return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const t = (node.nodeValue || '').trim();
        return (t === 'Ad' || t === 'Sponsored' || t === 'Promoted')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    const hits = [];
    while (walker.nextNode()) hits.push(walker.currentNode);
    for (const node of hits) {
      const badge = node.parentElement;
      if (!badge || badge.classList.contains('gv-ad')) continue;
      const br = badge.getBoundingClientRect();
      if (br.width === 0 || br.width > 80 || br.height > 34) continue;
      const item = listItemOf(badge); // outermost height-holder, not an inner box
      const r = item.getBoundingClientRect();
      if (r.height >= 20 && r.height <= 220 && r.width >= 320) {
        const inner = item.querySelectorAll('[data-test-id*="message-list-item" i]').length;
        if (inner <= 1) item.classList.add('gv-ad');
      }
    }
  }

  /* ================= INBOX NAV BADGE (v3.1) =================
     The count is Yahoo's total for the Inbox, never a count of the
     rows currently on screen (the list is virtualised - see the
     v3.1.0 note at the top). Sources, in order: the Inbox nav item's
     own count leaf / "(n)" / unread aria-label, then the document
     title's "(n)" prefix. No source = no badge, never a guess.     */

  function parseCountNumber(raw) {
    if (raw === null || raw === undefined) return null;
    const m = String(raw).replace(/,/g, '').match(/\d+/);
    if (!m) return null;
    const n = parseInt(m[0], 10);
    return isNaN(n) ? null : n;
  }

  // A leaf whose whole text is a bare count: "12", "(12)" or "99+".
  // Yahoo paints the folder count as exactly such a leaf.
  function bareCountLeaf(item) {
    let found = null;
    item.querySelectorAll('*').forEach((el) => {
      if (found || el.children.length) return;
      if (el.classList && el.classList.contains('gv-nav-badge')) return;
      const t = (el.textContent || '').trim();
      if (/^\(?\d[\d,]*\+?\)?$/.test(t)) found = el;
    });
    return found;
  }

  // "12 unread" / "unread: 12" phrasing, or a parenthesised "(12)".
  function countFromLabel(text) {
    if (!text) return null;
    const t = String(text);
    let m = t.match(/(\d[\d,]*)\s*\+?\s*(?:unread|new)\b/i);
    if (m) return parseCountNumber(m[1]);
    m = t.match(/\(\s*(\d[\d,]*)\s*\+?\s*\)/);
    if (m) return parseCountNumber(m[1]);
    return null;
  }

  function inboxUnreadCount(item) {
    if (item) {
      const leaf = bareCountLeaf(item);
      if (leaf) {
        const n = parseCountNumber(leaf.textContent);
        if (n !== null) return { count: n, nativeLeaf: leaf };
      }
      const labelled = [item].concat(
        Array.from(item.querySelectorAll('[aria-label]')));
      for (const el of labelled) {
        const n = countFromLabel(el.getAttribute && el.getAttribute('aria-label'));
        if (n !== null) return { count: n, nativeLeaf: leaf };
      }
      const fromText = countFromLabel(item.textContent);
      if (fromText !== null) return { count: fromText, nativeLeaf: leaf };
      // Last item-local shape: the label with a bare trailing total,
      // "Inbox 12" (Classic's "Inbox (n)" without the parentheses).
      const stripped = (item.textContent || '').trim().replace(/^inbox\b/i, '').trim();
      if (/^\d[\d,]*\+?$/.test(stripped)) {
        const n = parseCountNumber(stripped);
        if (n !== null) return { count: n, nativeLeaf: leaf };
      }
    }
    // Global fallback: Yahoo prefixes the tab title with the unread
    // total, e.g. "(12) Inbox - Yahoo Mail", on every folder view.
    const fromTitle = countFromLabel(document.title);
    if (fromTitle !== null) return { count: fromTitle, nativeLeaf: null };
    return null;
  }

  /* Finding the Inbox item: the collapsed rail's folder buttons
     DO carry stable data-test-ids (left-rail-Inbox-icon and
     friends - verified on Westin's real mailbox, 2026-10-22), so
     that is the fast path. The heuristic search of the known
     left-rail containers (match by href / aria-label / link text)
     remains as a fallback for other layouts. Hashed atomic
     classes are never used. */
  const NAV_ROOT_SELECTORS = [
    '#novation-left-rail',
    '[data-test-id="left-rail-scrolling-container"]',
    '[data-test-id*="left-rail" i]',
    '[data-test-id*="folder-list" i]',
    '[data-test-id*="folder-nav" i]',
    'nav[aria-label*="folder" i]',
  ];

  function isInboxCandidate(el) {
    // Never mistake our own promoted Unread tab for the Inbox tab
    // (its harvested href can legitimately contain "/inbox").
    if (el.closest && el.closest('[data-gv-unread-tab], .gv-rail-unread')) return false;
    const href = (el.getAttribute && el.getAttribute('href')) || '';
    if (/\/(inbox|folders?\/inbox|folders?\/1)(\/|\?|#|$)/i.test(href) ||
        /[?&#](folder|mbox)=inbox\b/i.test(href)) return true;
    const label = ((el.getAttribute && el.getAttribute('aria-label')) || '').trim();
    if (/^inbox\b/i.test(label)) return true;
    const tid = (el.getAttribute && el.getAttribute('data-test-id')) || '';
    if (/\binbox\b/i.test(tid)) return true;
    // Link text starting "Inbox" with a short total length - folder
    // rows are short; message rows and smart-tab labels are not
    // folder rows (and the tabs live outside the nav anyway).
    const text = (el.textContent || '').trim();
    if (/^inbox\b/i.test(text) && text.length <= 24) return true;
    return false;
  }

  function findInboxNavItem() {
    const byTestId = document.querySelector(
      '[data-test-id="left-rail-Inbox-icon"]');
    if (byTestId) return byTestId;
    const roots = [];
    for (const sel of NAV_ROOT_SELECTORS) {
      document.querySelectorAll(sel).forEach((el) => roots.push(el));
    }
    const scopes = roots.length ? roots : [document];
    for (const scope of scopes) {
      const candidates = scope.querySelectorAll(
        'a, button, [role="link"], [role="treeitem"], [role="option"], li');
      for (const el of candidates) {
        if (!isInboxCandidate(el)) continue;
        if (!roots.length) {
          // Whole-document fallback: insist the item really sits in
          // the nav strip - left edge of the window, nav-sized width.
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.width > 440 ||
              r.left > window.innerWidth * 0.3) continue;
        }
        return el;
      }
    }
    return null;
  }

  function railRootOf(el) {
    return (el && el.closest &&
      el.closest('#novation-left-rail, [data-test-id*="left-rail" i]')) || document;
  }

  /* The tab's OUTER ROW (v3.2.0): findInboxNavItem can match an
     element INSIDE Yahoo's tab (an inner button/span), and v3.1
     anchored the badge and inserted the Unread tab at that inner
     depth - badge clipped by the pill, stray icon inside the pill.
     The row is the direct child of the tab LIST: climb from the
     match while the current node's parent is NOT yet the container
     holding several folder tabs; the node whose parent holds >= 3
     tab-labelled children is the row. */
  function railTabOf(el, railRoot) {
    if (!el) return null;
    const tabText = /^(inbox|sent|drafts|trash|spam|folders|unread|starred|archive)\b/i;
    let node = el;
    for (let i = 0; i < 6 && node.parentElement; i++) {
      if (node === railRoot) break;
      const p = node.parentElement;
      let tabKids = 0;
      for (const c of p.children) {
        if (tabText.test((c.textContent || '').trim())) tabKids++;
      }
      if (tabKids >= 3 || p === railRoot) return node;
      node = p;
    }
    return node;
  }

  /* The tab's OUTER ROW: in the real rail (captured from
     Westin's mailbox, 2026-10-22) the folder tabs are
     ul > li > button, the button carrying the stable test id.
     The row everything anchors to is the li. */
  function navRowOf(el) {
    if (!el) return null;
    if (el.tagName === 'LI') return el;
    const li = el.closest && el.closest('li');
    if (li && li.parentElement && li.parentElement.tagName === 'UL') {
      return li;
    }
    return railTabOf(el, railRootOf(el));
  }

  /* Repair damage left by v3.1/v3.2 in an already-open tab: those
     versions WRAPPED Yahoo's Inbox svg in a span, which broke
     Yahoo's own show/hide CSS for the tab's two state icons - both
     rendered at once ("stacked icons"). Unwrap, restoring Yahoo's
     svg as a direct child of its button exactly where it was, and
     drop any badge that ended up inside a button. */
  function repairRailDamage() {
    document.querySelectorAll('.gv-nav-icon-wrap').forEach((wrap) => {
      const parent = wrap.parentElement;
      if (!parent) return;
      Array.from(wrap.childNodes).forEach((node) => {
        if (node.nodeType === 1 && node.classList &&
            node.classList.contains('gv-nav-badge')) return;
        parent.insertBefore(node, wrap);
      });
      wrap.remove();
    });
    document.querySelectorAll(
      'button .gv-nav-badge, a .gv-nav-badge').forEach((b) => b.remove());
    document.querySelectorAll('.gv-of-visible').forEach((el) => {
      el.classList.remove('gv-of-visible');
    });
  }

  // Which nav is Yahoo showing? The two modes are different
  // containers with different rules: collapsed = icon rail (our
  // badge + promoted Unread live there); expanded = wide list
  // (Yahoo shows Unread AND a count badge natively, so both of
  // our additions must stay out - they would only duplicate).
  function navIsExpanded() {
    return !!document.querySelector(
      '[data-test-id="expanded-left-rail"]');
  }

  function syncInboxBadge() {
    if (!CONFIG.showInboxBadge) return;
    repairRailDamage();
    if (navIsExpanded()) {
      document.querySelectorAll('.gv-nav-badge')
        .forEach((b) => b.remove());
      document.querySelectorAll('.gv-nav-has-unread, .gv-badge-host')
        .forEach((el) => {
          el.classList.remove('gv-nav-has-unread');
          el.classList.remove('gv-badge-host');
        });
      return;
    }
    const item = findInboxNavItem();
    const row = item ? (navRowOf(item) || item) : null;
    const found = item ? inboxUnreadCount(item) : null;
    const count = found ? found.count : null;

    if (!row || count === null || count <= 0) {
      document.querySelectorAll('.gv-nav-badge').forEach((b) => b.remove());
      document.querySelectorAll('.gv-nav-has-unread, .gv-badge-host')
        .forEach((el) => {
          el.classList.remove('gv-nav-has-unread');
          el.classList.remove('gv-badge-host');
        });
      document.querySelectorAll('.gv-nav-native-count').forEach((el) => {
        el.classList.remove('gv-nav-native-count');
      });
      return;
    }

    if (!row.classList.contains('gv-badge-host')) {
      row.classList.add('gv-badge-host');
    }
    if (!row.classList.contains('gv-nav-has-unread')) {
      row.classList.add('gv-nav-has-unread');
    }
    // The badge hangs on the ROW (the li), never inside Yahoo's
    // button: nothing is wrapped, moved or added in there, so
    // Yahoo's icon state CSS keeps working untouched.
    let badge = null;
    Array.from(row.children).forEach((c) => {
      if (c.classList && c.classList.contains('gv-nav-badge')) badge = c;
    });
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'gv-nav-badge';
      badge.setAttribute('aria-hidden', 'true');
      row.appendChild(badge);
    }
    document.querySelectorAll('.gv-nav-badge').forEach((b) => {
      if (b !== badge) b.remove();
    });
    // Pin it to the button's top-right corner, measured: the row
    // is wider than the pill, so the offsets are computed from the
    // real boxes and clamped inside the row - nothing clips it.
    const btn = (item.tagName === 'BUTTON' || item.tagName === 'A')
      ? item : row.querySelector('button, a');
    if (btn) {
      const br = btn.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      if (br.width > 0 && rr.width > 0) {
        const top = Math.max(0, Math.round(br.top - rr.top - 7)) + 'px';
        const right = Math.max(0, Math.round(rr.right - br.right - 7)) + 'px';
        if (badge.style.top !== top) badge.style.top = top;
        if (badge.style.right !== right) badge.style.right = right;
      }
    }
    const cap = CONFIG.inboxBadgeCap || 99;
    const display = count > cap ? cap + '+' : String(count);
    if (badge.textContent !== display) badge.textContent = display;
    const capped = count > cap;
    if (badge.classList.contains('gv-nav-badge-capped') !== capped) {
      badge.classList.toggle('gv-nav-badge-capped', capped);
    }
    const tip = count === 1
      ? '1 unread email in your Inbox'
      : count + ' unread emails in your Inbox';
    if (badge.title !== tip) badge.title = tip;
    // The same number as plain text beside the label would
    // duplicate the badge - hide Yahoo's leaf now that the icon
    // carries it. (The collapsed rail has no such leaf; the tab
    // title is the count source there.)
    const leaf = found.nativeLeaf;
    if (leaf && leaf !== badge &&
        !leaf.classList.contains('gv-nav-native-count')) {
      leaf.classList.add('gv-nav-native-count');
    }
  }

  /* ================= UNREAD PROMOTION (v3.3) =================
     Built from Westin's REAL rail DOM (captured 2026-10-22):
     nav#novation-left-rail holds ul > li > button per folder tab;
     the "..." control is button#left-rail-more-menu and its popup
     (ul#left-rail-more-menu-item-list) renders INSIDE the rail's
     last li. Menu items are li[role="menuitem"] with no href -
     React-owned nodes. So v3.3 never moves Yahoo's nodes and
     never searches or clicks anything outside the rail:
     - the rail tab is a sanitized clone of Yahoo's own Inbox li
       (their structure/classes = their exact look), re-glyphed
       with Yahoo's own Unread path data, relabelled, count-free
       (the number lives on the Inbox icon only);
     - activation clicks Yahoo's real controls by stable id: the
       Unread menu item when the popup is open, otherwise the
       More button first and the item the moment the popup
       appears. No URL is ever guessed or navigated to.        */
  const UNREAD_GLYPH_PATHS = [
    'M22 7.217a2.609 2.609 0 1 1-5.217 0 2.609 2.609 0 0 1 5.217 0',
    'M2 4.7v14.5h18v-7.244a4.8 4.8 0 0 1-1.8-.096v5.54H3.8V9.773L11 13.7l5.462-2.979a4.8 4.8 0 0 1-1.22-1.385L11 11.65 3.8 7.723V6.5h10.859a4.7 4.7 0 0 1 .683-1.8z',
  ];
  let placedTab = null;
  let unreadInsertTimes = [];
  let unreadLatchedOff = false;

  function sweepPlaced() {
    if (placedTab && !document.contains(placedTab)) placedTab = null;
    document.querySelectorAll('[data-gv-unread-tab]').forEach((t) => {
      if (t !== placedTab) t.remove();
    });
    // Legacy tabs from v3.1/v3.2 (bare placeholder / "transplant").
    document.querySelectorAll(
      '.gv-rail-unread, .gv-their-unread').forEach((t) => {
        if (t !== placedTab) t.remove();
      });
  }

  function clickUnreadMenuItem() {
    const list = document.getElementById(
      'left-rail-more-menu-item-list');
    if (!list) return false;
    const items = list.querySelectorAll('[role="menuitem"]');
    for (const it of items) {
      // The row's text is "Unread" + its count leaf with no space
      // ("Unread1") - a word boundary after "Unread" never comes.
      if (/^unread(?![a-z])/i.test((it.textContent || '').trim())) {
        it.click();
        return true;
      }
    }
    return false;
  }

  function activateUnread() {
    if (clickUnreadMenuItem()) return;
    const rail = document.getElementById('novation-left-rail');
    if (!rail) return;
    const more = rail.querySelector(
      '#left-rail-more-menu, ' +
      'button[aria-controls="left-rail-more-menu-item-list"]');
    if (!more) return;
    more.click();
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (clickUnreadMenuItem() || tries >= 40) {
        clearInterval(timer);
      }
    }, 50);
  }

  function buildUnreadTab(inboxRow) {
    const clone = inboxRow.cloneNode(true);
    const strip = (el) => {
      el.removeAttribute('id');
      el.removeAttribute('data-test-id');
      el.removeAttribute('data-folder-id');
      el.removeAttribute('data-iskeynav');
      el.removeAttribute('aria-description');
      el.removeAttribute('title');
      if (el.classList) {
        el.classList.remove('gv-of-visible', 'gv-nav-has-unread',
          'gv-badge-host');
      }
    };
    strip(clone);
    clone.querySelectorAll('*').forEach(strip);
    clone.querySelectorAll('.gv-nav-badge').forEach((b) => b.remove());
    const btn = clone.querySelector('button, a') || clone;
    btn.setAttribute('aria-label', 'Unread');
    btn.setAttribute('tabindex', '-1');
    // Yahoo renders TWO svgs on the active tab (selected-state and
    // default). Keep exactly one - the default-state one - and
    // give it Yahoo's own Unread glyph paths, verbatim.
    const svgs = Array.from(btn.querySelectorAll('svg'));
    svgs.forEach((svg, i) => {
      if (i < svgs.length - 1) svg.remove();
    });
    const glyph = svgs[svgs.length - 1];
    if (glyph) {
      glyph.innerHTML = UNREAD_GLYPH_PATHS
        .map((d) => '<path d="' + d + '"></path>').join('');
    }
    // The label leaf is the only text in a folder tab.
    clone.querySelectorAll('div, span').forEach((el) => {
      if (!el.children.length &&
          /^inbox$/i.test((el.textContent || '').trim())) {
        el.textContent = 'Unread';
      }
    });
    clone.setAttribute('data-gv-unread-tab', 'clone');
    clone.setAttribute('aria-label', 'Unread');
    clone.classList.add('gv-unread-tab');
    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      activateUnread();
    }, true);
    return clone;
  }

  function syncUnreadPromotion() {
    if (!CONFIG.promoteUnread) return;
    repairRailDamage();
    if (navIsExpanded()) {
      if (placedTab) { placedTab.remove(); placedTab = null; }
      sweepPlaced();
      return;
    }
    const inboxItem = findInboxNavItem();
    const inboxRow = inboxItem
      ? (navRowOf(inboxItem) || inboxItem) : null;
    sweepPlaced();
    if (!inboxRow || !inboxRow.parentElement) return;
    // The clone strategy needs the real li row; on any other
    // layout, skip rather than guess (v3.1-v3.2 guessed, and the
    // guesses are what kept breaking on the real rail).
    if (inboxRow.tagName !== 'LI') return;
    if (!placedTab) {
      if (unreadLatchedOff) return;
      const now = Date.now();
      unreadInsertTimes = unreadInsertTimes.filter((t) => now - t < 10000);
      if (unreadInsertTimes.length >= 3) {
        unreadLatchedOff = true;
        return;
      }
      unreadInsertTimes.push(now);
      placedTab = buildUnreadTab(inboxRow);
      inboxRow.parentElement.insertBefore(
        placedTab, inboxRow.nextSibling);
      sweepPlaced();
    }
    const active = /unread/i.test(
      window.location.pathname + window.location.search);
    if (placedTab.classList.contains('gv-unread-tab-active') !== active) {
      placedTab.classList.toggle('gv-unread-tab-active', active);
    }
  }

  /* ============================== TAGGING ============================== */
  function addBadge(row) {
    if (row.querySelector('.gv-badge')) return;
    const badge = document.createElement('span');
    badge.className = 'gv-badge';
    badge.textContent = 'UNREAD';
    // Prefer parking it next to the time/date leaf; else append to the row.
    let parked = false;
    for (const el of row.querySelectorAll('span, div, time')) {
      if (el.children.length) continue;
      const t = (el.textContent || '').trim();
      if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(t) ||
          /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i.test(t) ||
          /^Yesterday$/i.test(t)) {
        if (el.parentElement) { el.parentElement.appendChild(badge); parked = true; }
        break;
      }
    }
    if (!parked) row.appendChild(badge);
  }

  // Folder-chip rescue (v3.4.1): find elements inside an unread
  // row that Yahoo paints as a dark pill carrying short text (the
  // folder tag), and tag them .gv-row-chip so the CSS above can
  // restore their light letters. Detection uses the element's own
  // COMPUTED background (opaque and dark) plus a short text payload
  // - it never keys off Yahoo's hashed class names, and it skips
  // our own UNREAD pill (already correctly coloured).
  function tagRowChips(row) {
    // Re-validate chips tagged in a previous life of this recycled
    // row node: if the background is no longer dark, untag.
    for (const el of row.querySelectorAll('.gv-row-chip')) {
      if (!isDarkPill(el)) el.classList.remove('gv-row-chip');
    }
    for (const el of row.querySelectorAll('div, span')) {
      if (el.classList.contains('gv-badge')) continue;
      if (el.classList.contains('gv-row-chip')) continue;
      if (el.closest('.gv-row-chip')) continue;
      const text = (el.textContent || '').trim();
      if (!text || text.length > 24) continue;
      if (isDarkPill(el)) el.classList.add('gv-row-chip');
    }
  }
  function isDarkPill(el) {
    const m = getComputedStyle(el).backgroundColor
      .match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const parts = m[1].split(',').map((x) => parseFloat(x));
    const alpha = parts.length > 3 ? parts[3] : 1;
    if (alpha < 0.5) return false;
    const lum = (0.2126 * parts[0] + 0.7152 * parts[1] +
                 0.0722 * parts[2]) / 255;
    return lum < 0.4;
  }
  function tagRows() {
    const rows = findRows();
    if (CONFIG.hideSponsoredRows) tagAdRows(rows);
    for (const row of rows) {
      // Recycled-wrapper cleanup: Yahoo reuses list DOM nodes as you
      // scroll. If this row's outermost wrapper still carries gv-ad
      // from a previous life but its content is a real message now,
      // shed the class - a stale gv-ad is a blank band waiting to happen.
      const item = listItemOf(row);
      if (item.classList.contains('gv-ad') && !isAdRow(item)) {
        item.classList.remove('gv-ad');
      }
      if (row.classList.contains('gv-ad') || item.classList.contains('gv-ad')) {
        row.classList.remove('gv-unread', 'gv-read');
        continue;
      }
      row.classList.add('gv-row');
      if (isUnreadRow(row)) {
        row.classList.add('gv-unread');
        row.classList.remove('gv-read');
        addBadge(row);
        tagRowChips(row);
      } else {
        row.classList.add('gv-read');
        row.classList.remove('gv-unread');
        const b = row.querySelector('.gv-badge');
        if (b) b.remove();
        for (const el of row.querySelectorAll('.gv-row-chip')) {
          el.classList.remove('gv-row-chip');
        }
      }
    }
  }

  function tagAdsAndRail() {
    // Named ad slots wherever they appear (Inbox, Drafts, Sent...):
    // leaderboard banners, Taboola, GPT slots, the old right rail.
    document.querySelectorAll(
      '[data-test-id="leaderboard-ad"], [data-test-id*="leaderboard" i],' +
      '[data-test-id="mail-right-rail"], [id*="taboola" i],' +
      '[data-test-id*="taboola" i], div[id^="gpt-"], div[id*="-gpt-" i]'
    ).forEach((el) => el.classList.add('gv-ad'));
    document.querySelectorAll(
      'iframe[src*="doubleclick" i], iframe[src*="googlesyndication" i],' +
      'iframe[src*="amazon-adsystem" i], iframe[src*="criteo" i],' +
      'iframe[src*="adsrvr" i], iframe[src*="pubmatic" i],' +
      'iframe[src*="smartadserver" i], [aria-label="Advertisement" i]'
    ).forEach((el) => {
      let host = el;
      for (let i = 0; i < 3 && host.parentElement; i++) {
        if (host.parentElement.childElementCount <= 2) host = host.parentElement;
        else break;
      }
      host.classList.add('gv-ad');
    });

    let rail =
      document.querySelector('[data-test-id*="right-rail" i]') ||
      document.querySelector('aside[role="complementary"]') ||
      document.querySelector('[role="complementary"]');
    if (!rail) {
      for (const el of document.querySelectorAll('div, aside, section')) {
        const t = el.textContent || '';
        if (t.includes('Starred') && t.includes('Contacts')) {
          const r = el.getBoundingClientRect();
          if (r.width >= 180 && r.width <= 480 && r.left > window.innerWidth * 0.55) {
            rail = el; break;
          }
        }
      }
    }
    if (rail) rail.classList.add('gv-right-rail');

    for (const el of document.querySelectorAll('div, section')) {
      const t = el.textContent || '';
      if (/your storage limit is changing|compare yahoo mail plans/i.test(t) &&
          el.querySelectorAll('*').length < 12) {
        // Collapse the whole band, including any single-child wrapper
        // around it that would otherwise keep the band's height.
        let host = el;
        const h = el.getBoundingClientRect().height;
        while (host.parentElement && host.parentElement.childElementCount === 1 &&
               host.parentElement.getBoundingClientRect().height <= h + 8) {
          host = host.parentElement;
        }
        host.classList.add('gv-upsell');
        break;
      }
    }
  }

  /* ================= UPSELL CLEANUP (v3.2.0) =================
     Westin's "Emails to Myself" screenshot: the view is a Mail
     Plus sales pitch ("Talked to yourself lately?... Try Mail
     Plus") and the header carries a "Go ad-free" button. Hiding
     the pitch is cosmetic and safe; UNLOCKING is not something a
     script can do - Yahoo checks the account's Plus entitlement
     on their servers before serving the feature, so this section
     only removes buttons, menu entries and paywall cards. */
  function hideUpsells() {
    if (!CONFIG.hideUpsells) return;
    document.querySelectorAll(
      'a, button, [role="button"], [role="link"]').forEach((el) => {
      if (el.classList.contains('gv-upsell')) return;
      const t = ((el.getAttribute('aria-label') || '') + ' ' +
                 (el.textContent || '')).trim();
      if (/^(go ad-free|try mail plus|get mail plus|get yahoo mail plus|upgrade to mail plus|try yahoo mail plus)\b/i.test(t) &&
          t.length <= 44) {
        el.classList.add('gv-upsell');
      }
    });
    document.querySelectorAll(
      '[data-test-id*="upsell" i], [data-test-id*="mail-plus" i],' +
      '[data-test-id*="go-ad-free" i]').forEach((el) => {
      el.classList.add('gv-upsell');
    });
    // "Yahoo Mail Plus" entry in menus/popovers: hide its row.
    const pools = document.querySelectorAll(
      '[role="menu"], [role="dialog"], [data-test-id*="menu" i], ' +
      '[data-test-id*="popover" i]');
    pools.forEach((scope) => {
      scope.querySelectorAll('a, button, li, div').forEach((el) => {
        if ((el.textContent || '').trim() === 'Yahoo Mail Plus') {
          // Hide the whole menu row (the li), not just the label.
          (el.closest('li, [role="menuitem"]') || el)
            .classList.add('gv-upsell');
        }
      });
    });
    // Paywall empty-state card ("...only available to Mail Plus
    // subscribers"): hide the whole pitch block, button included.
    for (const el of document.querySelectorAll('div, section')) {
      const t = el.textContent || '';
      if (!/only available to (yahoo )?mail plus subscribers/i.test(t)) continue;
      if (t.length > 700) continue;
      let host = el;
      for (let i = 0; i < 4 && host.parentElement; i++) {
        const pt = host.parentElement.textContent || '';
        if (pt.length <= t.length + 60 && pt.length < 900) host = host.parentElement;
        else break;
      }
      host.classList.add('gv-upsell');
      break;
    }
  }

  /* Theme detection v2.3 - WHY THE OLD ONE BROKE LIGHT MODE:
     v2.2 sampled document.body's background. On Yahoo's light theme the
     body background is TRANSPARENT (rgba(0,0,0,0)) - the light surface is
     painted by child containers. Parsing transparent as RGB gives
     0,0,0 = luminance 0 = "dark", so the dark palette latched onto a
     light UI. Its class/attribute check had the same flaw class: it
     could add .gv-dark but never remove it.
     v2.3 detects from PAINT, not metadata: it samples surfaces we do
     not style (the list container's ancestors, the search-bar's
     ancestors, body/html as last resort), skips fully transparent
     backgrounds, and uses the first actually-painted color. Symmetric:
     it can turn gv-dark OFF as well as on. The dark palette itself is
     byte-for-byte v2.2 - only detection changed. */
  let lastDark = null;
  function paintedLuminance() {
    const probes = [];
    const row = document.querySelector('[data-test-id*="message-list-item" i]');
    if (row) {
      let p = row.parentElement;
      for (let i = 0; i < 5 && p; i++) { probes.push(p); p = p.parentElement; }
    }
    const search = document.querySelector(
      'input[type="search"], input[placeholder*="Search" i]');
    if (search) {
      let p = search.parentElement;
      for (let i = 0; i < 5 && p; i++) { probes.push(p); p = p.parentElement; }
    }
    if (document.body) probes.push(document.body);
    probes.push(document.documentElement);
    for (const el of probes) {
      if (!el) continue;
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg && bg.match(/[\d.]+/g);
      if (!m || m.length < 3) continue;
      const alpha = m.length >= 4 ? parseFloat(m[3]) : 1;
      if (alpha < 0.05) continue; // transparent - keep looking, do NOT read as black
      const lin = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * lin(+m[0]) + 0.7152 * lin(+m[1]) + 0.0722 * lin(+m[2]);
    }
    return null;
  }

  function detectDark() {
    const html = document.documentElement;
    const lum = paintedLuminance();
    if (lum !== null) {
      lastDark = lum < 0.35;
      html.classList.toggle('gv-dark', lastDark);
      return;
    }
    if (lastDark !== null) { html.classList.toggle('gv-dark', lastDark); return; }
    // No painted surface found yet (early page load): fall back to
    // Yahoo's own markers, read symmetrically both ways.
    const marker = (html.className + ' ' +
      (document.body ? document.body.className : '') + ' ' +
      html.getAttribute('data-theme') + ' ' +
      html.getAttribute('data-color-scheme'));
    const dark = /\bdark\b/i.test(marker) && !/\blight\b/i.test(marker);
    html.classList.toggle('gv-dark', dark);
  }

  /* ============================== BOOT ============================== */
  const style = document.createElement('style');
  style.id = 'gv-yahoo-classic-fix';
  style.textContent = CSS;
  document.documentElement.appendChild(style);
  if (CONFIG.hideRightRail) document.documentElement.classList.add('gv-hide-rail');
  if (CONFIG.modernExpandedNav) document.documentElement.classList.add('gv-modern-expanded');
  if (CONFIG.darkMethod === 'ring') document.documentElement.classList.add('gv-ring');

  let queued = false;
  function run() { queued = false; detectDark(); hideBadgeAdRows(); tagRows(); tagAdsAndRail(); hideUpsells(); syncInboxBadge(); syncUnreadPromotion(); }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  document.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('load', schedule);
  // Injected after both events already fired (late Tampermonkey
  // injection): run now instead of waiting for the 4s tick.
  if (document.readyState !== 'loading') schedule();
  if (CONFIG.observeChanges) {
    const startObserver = () => {
      new MutationObserver(schedule).observe(document.documentElement, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['class', 'data-theme', 'style'],
      });
    };
    if (document.body) startObserver();
    else document.addEventListener('DOMContentLoaded', startObserver);
    setInterval(schedule, 4000);
  }
})();
