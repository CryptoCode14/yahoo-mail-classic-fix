// ==UserScript==
// @name         Yahoo Mail Classic Fix - Unread You Can Actually See + No Ads
// @namespace    grandvalley.yahoomailfix
// @version      3.0.0
// @description  Makes unread mail unmistakable (whole-row tint + purple left bar + bold, in light AND dark mode), mutes read mail, hides ads including sponsored rows inside the list, and brings back the old Yahoo Mail Classic list feel. Works on mail.yahoo.com.
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
      } else {
        row.classList.add('gv-read');
        row.classList.remove('gv-unread');
        const b = row.querySelector('.gv-badge');
        if (b) b.remove();
      }
    }
  }

  function tagAdsAndRail() {
    document.querySelectorAll(
      'iframe[src*="doubleclick" i], iframe[src*="googlesyndication" i],' +
      'iframe[src*="amazon-adsystem" i], [aria-label="Advertisement" i]'
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
  if (CONFIG.darkMethod === 'ring') document.documentElement.classList.add('gv-ring');

  let queued = false;
  function run() { queued = false; detectDark(); hideBadgeAdRows(); tagRows(); tagAdsAndRail(); }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  document.addEventListener('DOMContentLoaded', schedule);
  window.addEventListener('load', schedule);
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
