// ==UserScript==
// @name         Yahoo Mail Classic Fix - Unread You Can Actually See + No Ads
// @namespace    grandvalley.yahoomailfix
// @version      3.8.6
// @description  Makes unread mail unmistakable in light and dark mode: an Unread Style settings page inside Yahoo Settings (12 presets plus custom colours), a global accent colour that recolours Yahoo's purple chrome, a working Emails to Myself without Mail Plus, an unread-count badge on the Inbox icon, and ad/upsell cleanup. Works on mail.yahoo.com.
// @author       Westin Kropf
// @match        https://mail.yahoo.com/*
// @match        https://*.mail.yahoo.com/*
// @downloadURL  https://raw.githubusercontent.com/CryptoCode14/yahoo-mail-classic-fix/main/yahoo-mail-classic.user.js
// @updateURL    https://raw.githubusercontent.com/CryptoCode14/yahoo-mail-classic-fix/main/yahoo-mail-classic.user.js
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(function () {
  'use strict';

  /* ============================== CONFIG ============================== */
  const CONFIG = {
    hideRightRail: true,     // hide Starred/Contacts/ad rail, list goes full width
    hideSponsoredRows: true, // hide "Ad" rows anywhere in the list, not just the top
    observeChanges: true,
    // lavender strip with dark text on the dark UI (default). 'ring' =
    // rows stay dark but unread gets a bright lavender outline + tint.
    darkMethod: 'strip',
    showInboxBadge: true,        inboxBadgeCap: 99,       // counts above this display as "99+"
    promoteUnread: true,         hideUpsells: true,           modernExpandedNav: true,   };

  /* ============================== CSS ============================== */
  const CSS = `
  :root {
    --gv-unread-bg: #e9e2ff;
    --gv-unread-bg-hover: #ddd0ff;
    --gv-unread-fg: #0f0f14;
    --gv-unread-bar: var(--gv-accent, #6001d2);
    --gv-read-bg: #eceff3;
    --gv-read-fg: #5f6368;
    --gv-row-border: #d4d4d8;
    --gv-badge-bg: var(--gv-accent, #6001d2);
    --gv-badge-fg: #ffffff;
    --gv-unread-ring: transparent;
    --gv-nav-badge-ring: #ffffff;
  }
  
  html.gv-dark {
    
    --gv-unread-bg: #262330;
    --gv-unread-bg-hover: #2e2a3c;
    --gv-unread-fg: #f4f2fa;
    --gv-unread-bar: var(--gv-accent-muted, #8b7bb8);
    --gv-unread-ring: transparent;
    --gv-read-bg: transparent;
    --gv-read-fg: #e4e4e9;
    --gv-row-border: #3a3a41;
    --gv-badge-bg: #3a2d5c;
    --gv-badge-fg: #e9e4ff;
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
  
  html.gv-dark .gv-unread [data-test-id="unread-indicator"] span {
    background-color: var(--gv-unread-dot, #a78bfa) !important;
  }
  
  html.gv-u-accent .gv-unread .gv-lead {
    color: var(--gv-unread-accent) !important;
  }
  
  .gv-unread .gv-row-chip-light,
  .gv-unread .gv-row-chip-light * { color: #1f1f24 !important; }

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

  
  .gv-unread .gv-row-chip,
  .gv-unread .gv-row-chip * { color: #ffffff !important; }

  
  html.gv-dark .gv-unread [id^="email-message-actions"],
  html.gv-dark .gv-unread [id^="email-message-actions"] * {
    color: #ffffff !important;
  }

  
  
  .gv-badge-host {
    position: relative !important;
  }
  
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
    border-radius: 8px !important;
    transition: background-color 120ms ease !important;
  }
  html.gv-dark.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:hover {
    background-color: rgba(255, 255, 255, 0.05) !important;
  }
  
  html.gv-dark.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) {
    background-color: #2c2837 !important;
    box-shadow: none !important;
  }
  html.gv-dark.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) a {
    font-weight: 600 !important;
    color: #ffffff !important;
  }
  html.gv-dark.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) svg {
    color: var(--gv-accent-soft, #b79cff) !important;
  }
  
  html.gv-dark.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]):hover {
    background-color: #383148 !important;
  }
  /* The count as metadata, not an alarm: dark pill, hairline
     border, soft violet text. */
  html.gv-dark.gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="badge"] > span {
    background-color: #262230 !important;
    color: var(--gv-accent-pale, #d3cbea) !important;
    border: 1px solid rgba(255, 255, 255, 0.10) !important;
    border-radius: 999px !important;
    padding: 1px 8px !important;
    font-weight: 600 !important;
  }
  
  html:not(.gv-dark).gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:hover {
    background-color: rgba(0, 0, 0, 0.045) !important;
  }
  html:not(.gv-dark).gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) {
    background-color: color-mix(in srgb, var(--gv-accent, #6001d2) 14%, #ffffff) !important;
    box-shadow: none !important;
  }
  html:not(.gv-dark).gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) a {
    font-weight: 600 !important;
    color: #1d1b26 !important;
  }
  html:not(.gv-dark).gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]) svg {
    color: var(--gv-accent, #6001d2) !important;
  }
  html:not(.gv-dark).gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="menu-list-item"]:has(> a[aria-label^="Selected"]):hover {
    background-color: color-mix(in srgb, var(--gv-accent, #6001d2) 24%, #ffffff) !important;
  }
  html:not(.gv-dark).gv-modern-expanded [data-test-id="expanded-left-rail"] [data-test-id="badge"] > span {
    background-color: color-mix(in srgb, var(--gv-accent, #6001d2) 14%, #ffffff) !important;
    color: var(--gv-accent-dark, #4a01a8) !important;
    border: 1px solid color-mix(in srgb, var(--gv-accent, #6001d2) 30%, #ffffff) !important;
    border-radius: 999px !important;
    padding: 1px 8px !important;
    font-weight: 600 !important;
  }

  
  #gv-settings-page { flex: 1 1 auto; min-width: 0; min-height: 0; height: 100%; max-height: 100%; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; color: #f2f2f5; scrollbar-width: thin; scrollbar-color: transparent transparent; }
  #gv-settings-page:hover, #gv-settings-page:focus-within { scrollbar-color: rgba(255,255,255,0.22) transparent; }
  #gv-settings-page::-webkit-scrollbar { width: 8px; }
  #gv-settings-page::-webkit-scrollbar-track { background: transparent; }
  #gv-settings-page::-webkit-scrollbar-thumb { background: transparent; border-radius: 8px; }
  #gv-settings-page:hover::-webkit-scrollbar-thumb, #gv-settings-page:focus-within::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); }
  #gv-settings-page::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.38); }
  html:not(.gv-dark) #gv-settings-page:hover, html:not(.gv-dark) #gv-settings-page:focus-within { scrollbar-color: rgba(0,0,0,0.22) transparent; }
  html:not(.gv-dark) #gv-settings-page:hover::-webkit-scrollbar-thumb, html:not(.gv-dark) #gv-settings-page:focus-within::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.22); }
  .gv-s-wrap { padding: 20px 30px 28px; max-width: 1220px; }
  .gv-s-title { font-size: 24px; font-weight: 600; color: #ffffff; }
  .gv-s-sub { font-size: 13.5px; color: rgba(235,235,240,0.55); margin-top: 6px; line-height: 1.5; }
  .gv-s-cols { display: flex; gap: 26px; align-items: flex-start; }
  .gv-s-main { flex: 1 1 auto; min-width: 0; max-width: 720px; }
  .gv-s-side { width: 408px; flex: none; position: sticky; top: 14px; }
  @media (max-width: 1100px) {
    .gv-s-wrap { padding: 16px 20px 24px; }
    .gv-s-cols { gap: 20px; }
  }
  @media (max-width: 980px) {
    .gv-s-cols { flex-direction: column; align-items: stretch; }
    .gv-s-side { width: 100%; position: static; }
    .gv-s-main { max-width: none; }
  }
  @media (max-width: 640px) {
    .gv-s-wrap { padding: 14px 14px 20px; }
    .gv-s-title { font-size: 20px; }
    .gv-s-sub { font-size: 12.5px; }
    .gv-pv-who { max-width: 92px; }
  }
  @media (max-width: 560px) {
    .gv-pv-chip { display: none; }
    .gv-s-pv-head .gv-s-pv-tag { display: none; }
    .gv-pv-row { gap: 7px; padding: 0 10px; }
    .gv-pv-av { width: 26px; height: 26px; }
    .gv-pv-who { max-width: 80px; }
  }
  .gv-s-sect { font-size: 15px; font-weight: 600; color: #ffffff; margin: 22px 0 10px; }
  .gv-s-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(205px, 100%), 1fr)); gap: 8px; min-width: 0; }
  #gv-settings-page .gv-s-tile { min-width: 0; }
  #gv-settings-page .gv-s-tile { text-align: left; color: #f2f2f5; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 8px; cursor: pointer; font: inherit; }
  #gv-settings-page .gv-s-tile:hover { border-color: rgba(255,255,255,0.30); }
  #gv-settings-page .gv-s-tile.gv-sel { border-color: var(--gv-accent, #6001d2); box-shadow: 0 0 0 1px var(--gv-accent, #6001d2); }
  .gv-s-prev { background: #101014; border-radius: 6px; overflow: hidden; margin-bottom: 7px; }
  .gv-s-u { display: block; font-size: 11px; font-weight: 700; padding: 5px 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gv-s-r { display: block; font-size: 11px; padding: 5px 8px; color: #a9a9b3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  #gv-settings-page .gv-s-name { font-size: 13px; font-weight: 600; color: #f2f2f5; display: flex; justify-content: space-between; align-items: center; }
  .gv-s-name .gv-check { color: var(--gv-accent-soft, #b79cff); font-weight: 700; visibility: hidden; }
  #gv-settings-page .gv-s-tile.gv-sel .gv-check { visibility: visible; }
  .gv-s-card { border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; padding: 2px 16px; background: rgba(255,255,255,0.02); }
  #gv-settings-page .gv-s-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 0; border-top: 1px solid rgba(255,255,255,0.07); font-size: 14px; color: #e8e8ec; }
  #gv-settings-page .gv-s-row:first-child { border-top: 0; }
  .gv-s-row input[type="color"] { width: 46px; height: 28px; border: 1px solid rgba(255,255,255,0.16); border-radius: 6px; background: transparent; cursor: pointer; padding: 2px; }
  .gv-s-row input[type="checkbox"] { width: 17px; height: 17px; accent-color: var(--gv-accent, #6001d2); cursor: pointer; }
  .gv-seg { display: flex; border: 1px solid rgba(255,255,255,0.14); border-radius: 8px; overflow: hidden; }
  .gv-seg button { background: transparent; border: 0; color: rgba(235,235,240,0.6); font: inherit; font-size: 12.5px; font-weight: 600; padding: 7px 11px; cursor: pointer; }
  .gv-seg button.gv-on { background: #2c2837; color: #ffffff; }
  .gv-s-note { font-size: 12.5px; line-height: 1.55; color: rgba(235,235,240,0.45); margin-top: 12px; }
  /* live preview: sample rows are REAL message rows (same
     data-test-id), painted by the production row pipeline */
  .gv-s-preview { border: 1px solid rgba(255,255,255,0.12); border-radius: 12px; overflow: hidden; }
  .gv-s-pv-head { display: flex; justify-content: space-between; align-items: baseline; padding: 11px 14px; font-size: 13.5px; font-weight: 600; color: #ffffff; border-bottom: 1px solid rgba(255,255,255,0.08); }
  .gv-s-pv-head .gv-s-pv-tag { font-size: 11px; font-weight: 400; color: rgba(235,235,240,0.45); }
  .gv-s-pv-list { background: #101014; }
  .gv-pv-row { display: flex; align-items: center; gap: 10px; padding: 0 14px; height: 48px; font-size: 13.5px; }
  .gv-pv-av { width: 30px; height: 30px; border-radius: 50%; flex: none; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 700; color: #ffffff; }
  .gv-pv-who { flex: none; max-width: 128px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gv-pv-chip { flex: none; background: #131313; color: #ffffff; font-size: 10.5px; border-radius: 4px; padding: 2px 6px; }
  .gv-pv-what { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gv-pv-snip { font-weight: 400; }
  .gv-pv-when { flex: none; font-size: 12px; }
  .gv-s-pv-note { font-size: 12px; line-height: 1.55; color: rgba(235,235,240,0.45); margin-top: 10px; }
  /* light theme variants */
  html:not(.gv-dark) #gv-settings-page { color: #1d1d21; }
  html:not(.gv-dark) .gv-s-title { color: #1d1d21; }
  html:not(.gv-dark) .gv-s-sub { color: rgba(20,20,30,0.60); }
  html:not(.gv-dark) .gv-s-sect { color: #1d1d21; }
  html:not(.gv-dark) #gv-settings-page .gv-s-tile { color: #1d1d21; border-color: rgba(0,0,0,0.14); background: rgba(0,0,0,0.02); }
  html:not(.gv-dark) #gv-settings-page .gv-s-tile:hover { border-color: rgba(0,0,0,0.32); }
  html:not(.gv-dark) #gv-settings-page .gv-s-tile.gv-sel { border-color: var(--gv-accent, #6001d2); }
  html:not(.gv-dark) #gv-settings-page .gv-s-name { color: #1d1d21; }
  html:not(.gv-dark) .gv-s-name .gv-check { color: var(--gv-accent, #6001d2); }
  html:not(.gv-dark) .gv-s-card { border-color: rgba(0,0,0,0.14); background: rgba(0,0,0,0.02); }
  html:not(.gv-dark) #gv-settings-page .gv-s-row { color: #26262c; border-top-color: rgba(0,0,0,0.08); }
  html:not(.gv-dark) .gv-s-row input[type="color"] { border-color: rgba(0,0,0,0.20); }
  html:not(.gv-dark) .gv-seg { border-color: rgba(0,0,0,0.18); }
  html:not(.gv-dark) .gv-seg button { color: rgba(20,20,30,0.60); }
  html:not(.gv-dark) .gv-seg button.gv-on { background: var(--gv-accent, #6001d2); color: #ffffff; }
  html:not(.gv-dark) .gv-s-note { color: rgba(20,20,30,0.50); }
  html:not(.gv-dark) .gv-s-preview { border-color: rgba(0,0,0,0.14); }
  html:not(.gv-dark) .gv-s-pv-head { color: #1d1d21; border-bottom-color: rgba(0,0,0,0.08); }
  html:not(.gv-dark) .gv-s-pv-head .gv-s-pv-tag { color: rgba(20,20,30,0.45); }
  html:not(.gv-dark) .gv-s-pv-list { background: #f5f5f7; }
  html:not(.gv-dark) .gv-s-prev { background: #f5f5f7; }
  html:not(.gv-dark) .gv-s-r { color: rgba(24,24,30,0.55); }
  html:not(.gv-dark) .gv-s-pv-note { color: rgba(20,20,30,0.50); }
  
  .gv-acc-bg { background-color: var(--gv-acc-el) !important; }
  .gv-acc-bg:hover { background-color: var(--gv-acc-el-h) !important; }
  .gv-acc-pb::before { background-color: var(--gv-acc-pb) !important; border-color: var(--gv-acc-pb) !important; }
  .gv-acc-pa::after { background-color: var(--gv-acc-pa) !important; border-color: var(--gv-acc-pa) !important; }
  #gv-settings-page .gv-s-textin { font: inherit; font-size: 13px; color: #f2f2f5; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.16); border-radius: 8px; padding: 7px 10px; flex: 0 1 240px; min-width: 110px; box-sizing: border-box; }
  html:not(.gv-dark) #gv-settings-page .gv-s-textin { color: #26262c; background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.18); }
  #gv-settings-page .gv-a-reset { font: inherit; font-size: 12.5px; font-weight: 600; color: #e8e8ec; background: transparent; border: 1px solid rgba(255,255,255,0.16); border-radius: 8px; padding: 7px 11px; cursor: pointer; }
  html:not(.gv-dark) #gv-settings-page .gv-a-reset { color: #26262c; border-color: rgba(0,0,0,0.18); }
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
     friends - verified against a live Yahoo mailbox), so
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
        // also matches Yahoo's SETTINGS nav ("Inbox categories"
        // sits at the left edge, nav-width) - never accept a mail
        // nav item from inside the settings list.
        if (gvInSettingsNav(el)) continue;
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

  /* The tab's OUTER ROW: in the real rail the folder tabs are
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
    if (inboxRow && gvInSettingsNav(inboxRow)) return;
    if (!inboxRow || !inboxRow.parentElement) return;
    // The clone strategy needs the real li row; on any other
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

  // row that Yahoo paints as a dark pill carrying short text (the
  // folder tag), and tag them .gv-row-chip so the CSS above can
  // restore their light letters. Detection uses the element's own
  // COMPUTED background (opaque and dark) plus a short text payload
  // - it never keys off Yahoo's hashed class names, and it skips
  // our own UNREAD pill (already correctly coloured).
  // unread row .gv-lead so the accent colour lands exactly where
  // Yahoo already draws the eye (sender / subject / time). Sampling
  // mirrors boldMajority: our own gv classes come off first, or the
  // strip's forced weight would make every leaf look bold.
  function tagRowLeads(row) {
    const hadU = row.classList.contains('gv-unread');
    const hadR = row.classList.contains('gv-read');
    row.classList.remove('gv-unread', 'gv-read');
    const leaves = row.querySelectorAll('span, div, time, td, a');
    for (const el of leaves) {
      let hasTextChild = false;
      for (const c of el.children) {
        if ((c.textContent || '').trim().length >= 2) { hasTextChild = true; break; }
      }
      if (hasTextChild) continue;
      const direct = Array.from(el.childNodes)
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent.trim()).join(' ');
      if (direct.length < 3) continue;
      if (el.closest('.gv-badge, .gv-row-chip, .gv-row-chip-light, [id^="email-message-actions"]')) continue;
      const btn = el.closest('button');
      if (btn && btn.getBoundingClientRect().width < 180) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const w = parseInt(cs.fontWeight, 10);
      if ((!isNaN(w) && w >= 600) || cs.fontWeight === 'bold') {
        el.classList.add('gv-lead');
      }
    }
    if (hadU) row.classList.add('gv-unread');
    if (hadR) row.classList.add('gv-read');
  }
  function tagRowChips(row) {
    // Re-validate chips tagged in a previous life of this recycled
    // row node: if the background no longer fits, untag.
    for (const el of row.querySelectorAll('.gv-row-chip')) {
      if (!isDarkPill(el)) el.classList.remove('gv-row-chip');
    }
    for (const el of row.querySelectorAll('.gv-row-chip-light')) {
      if (!isLightPill(el)) el.classList.remove('gv-row-chip-light');
    }
    for (const el of row.querySelectorAll('div, span')) {
      if (el.classList.contains('gv-badge')) continue;
      if (el.classList.contains('gv-row-chip')) continue;
      if (el.classList.contains('gv-row-chip-light')) continue;
      if (el.closest('.gv-row-chip, .gv-row-chip-light')) continue;
      const text = (el.textContent || '').trim();
      if (!text || text.length > 24) continue;
      if (isDarkPill(el)) el.classList.add('gv-row-chip');
      else if (isLightPill(el)) el.classList.add('gv-row-chip-light');
    }
    // (icon buttons only), so the text pass above cannot see it.
    // Fingerprint: dark opaque background + at least two svg icons
    // + no text anywhere inside. Nothing else in a row matches that
    // (the avatar wrapper is transparent; the date cell has one svg
    // and text; the folder chip has text and no svg).
    for (const el of row.querySelectorAll('div, span')) {
      if (el.classList.contains('gv-badge')) continue;
      if (el.classList.contains('gv-row-chip')) continue;
      if (el.closest('.gv-row-chip, .gv-row-chip-light')) continue;
      if ((el.textContent || '').trim().length > 0) continue;
      if (el.querySelectorAll('svg').length < 2) continue;
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
  function isLightPill(el) {
    const m = getComputedStyle(el).backgroundColor
      .match(/rgba?\(([^)]+)\)/);
    if (!m) return false;
    const parts = m[1].split(',').map((x) => parseFloat(x));
    const alpha = parts.length > 3 ? parts[3] : 1;
    if (alpha < 0.5) return false;
    const lum = (0.2126 * parts[0] + 0.7152 * parts[1] +
                 0.0722 * parts[2]) / 255;
    return lum > 0.6;
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
        tagRowLeads(row);
      } else {
        row.classList.add('gv-read');
        row.classList.remove('gv-unread');
        const b = row.querySelector('.gv-badge');
        if (b) b.remove();
        for (const el of row.querySelectorAll('.gv-row-chip')) {
          el.classList.remove('gv-row-chip');
        }
        for (const el of row.querySelectorAll('.gv-row-chip-light')) {
          el.classList.remove('gv-row-chip-light');
        }
        for (const el of row.querySelectorAll('.gv-lead')) {
          el.classList.remove('gv-lead');
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
      const t = (el.textContent || '').replace(/\s+/g, ' ');
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
        gvMarkUpsell(host);
        break;
      }
    }
  }

  // (or is) live mail UI, or if it is view-sized. hideUpsells
  // once tagged a container Yahoo reuses across folders - the
  // Emails to Myself paywall view - and every folder stayed
  // blank until reload.
  function gvUpsellForbidden(el) {
    if (!el || el === document.documentElement ||
        el === document.body) return true;
    if (el.querySelector('[data-test-id="message-list-item"], ' +
        '[data-test-id="message-list"], ' +
        '[data-test-id="expanded-left-rail"], ' +
        '[data-test-id="collapsed-left-rail"], ' +
        '#gv-settings-page')) return true;
    const r = el.getBoundingClientRect();
    if (r.height > window.innerHeight * 0.7 &&
        r.width > window.innerWidth * 0.45) return true;
    return false;
  }
  function gvMarkUpsell(el) {
    if (el && !gvUpsellForbidden(el)) el.classList.add('gv-upsell');
  }
  function hideUpsells() {
    if (!CONFIG.hideUpsells) return;
    // Self-heal: anything guarded that an earlier build tagged
    // comes back right now - no reload needed.
    document.querySelectorAll('.gv-upsell').forEach((el) => {
      if (gvUpsellForbidden(el)) el.classList.remove('gv-upsell');
    });
    document.querySelectorAll(
      'a, button, [role="button"], [role="link"]').forEach((el) => {
      if (el.classList.contains('gv-upsell')) return;
      const t = ((el.getAttribute('aria-label') || '') + ' ' +
                 (el.textContent || '')).trim();
      if (/^(go ad-free|try mail plus|get mail plus|get yahoo mail plus|upgrade to mail plus|try yahoo mail plus)\b/i.test(t) &&
          t.length <= 44) {
        gvMarkUpsell(el);
      }
    });
    document.querySelectorAll(
      '[data-test-id*="upsell" i], [data-test-id*="mail-plus" i],' +
      '[data-test-id*="go-ad-free" i]').forEach((el) => {
      // mail-plus test-id - hiding it blanked the whole app.
      if (el.querySelectorAll('*').length <= 8) gvMarkUpsell(el);
    });
    // "Yahoo Mail Plus" entry in menus/popovers: hide its row.
    const pools = document.querySelectorAll(
      '[role="menu"], [role="dialog"], [data-test-id*="menu" i], ' +
      '[data-test-id*="popover" i]');
    pools.forEach((scope) => {
      scope.querySelectorAll('a, button, li, div').forEach((el) => {
        if ((el.textContent || '').trim() === 'Yahoo Mail Plus') {
          // Hide the whole menu row (the li), not just the label.
          gvMarkUpsell(el.closest('li, [role="menuitem"]') || el);
        }
      });
    });
    // Paywall empty-state card ("...only available to Mail Plus
    // subscribers"): hide the pitch block, button included.
    // order hits the view container first, and hiding that was
    // the blank-page bug. Whitespace is normalised before
    // matching (multi-line text nodes broke the literal regex).
    let pitch = null;
    let pitchT = '';
    for (const el of document.querySelectorAll('div, section')) {
      const t = (el.textContent || '').replace(/\s+/g, ' ');
      if (!/only available to (yahoo )?mail plus subscribers/i.test(t)) continue;
      if (t.length > 700) continue;
      if (!pitch || t.length < pitchT.length) { pitch = el; pitchT = t; }
    }
    if (pitch) {
      let host = pitch;
      for (let i = 0; i < 4 && host.parentElement; i++) {
        const pt = (host.parentElement.textContent || '')
          .replace(/\s+/g, ' ');
        if (pt.length <= pitchT.length + 60 && pt.length < 900 &&
            !gvUpsellForbidden(host.parentElement) &&
            host.parentElement.querySelectorAll('*').length < 300) {
          host = host.parentElement;
        } else break;
      }
      gvMarkUpsell(host);
    }
  }

  let gvSelfWired = false;
  function gvSelfAddress() {
    if (gvSettings.selfEmail) return gvSettings.selfEmail;
    const mailto = document.querySelector('a[href^="mailto:"]');
    if (mailto) {
      const addr = (mailto.getAttribute('href') || '').slice(7)
        .split('?')[0].trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
        gvSettings.selfEmail = addr;
        gvSaveSettings();
        return addr;
      }
    }
    const counts = {};
    document.querySelectorAll('span, a, div, p, li, td')
      .forEach((el) => {
        if (el.children.length) return;
        if (el.closest('[data-test-id="message-list-item"], ' +
            '#gv-settings-page, [data-test-id*="message-view" i]')) {
          return;
        }
        const t = (el.textContent || '').trim();
        if (t.length <= 60 &&
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
          counts[t] = (counts[t] || 0) + 1;
        }
      });
    let best = '';
    let bestN = 0;
    for (const addr in counts) {
      const score = counts[addr] +
        (/@yahoo\./i.test(addr) ? 10 : 0);
      if (score > bestN) { bestN = score; best = addr; }
    }
    if (best) {
      gvSettings.selfEmail = best;
      gvSaveSettings();
    }
    return best;
  }
  function gvDriveSearch(query) {
    const findInput = () => document.querySelector(
      'input[data-test-id="search-input"], input[type="search"], ' +
      'input[placeholder*="search" i], [role="search"] input');
    let input = findInput();
    const go = () => {
      if (!input) input = findInput();
      if (!input) return false;
      input.focus();
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, query);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      for (const type of ['keydown', 'keypress', 'keyup']) {
        input.dispatchEvent(new KeyboardEvent(type, {
          key: 'Enter', code: 'Enter', keyCode: 13, which: 13,
          bubbles: true, cancelable: true,
        }));
      }
      return true;
    };
    if (input) return go();
    const btn = Array.from(document.querySelectorAll(
      'button, [role="button"], a')).find((b) =>
      /search/i.test(b.getAttribute('aria-label') || ''));
    if (btn) { btn.click(); setTimeout(go, 350); return true; }
    return false;
  }
  function gvRunSelfSearch() {
    const addr = gvSelfAddress();
    const query = addr
      ? 'from:' + addr + ' to:' + addr
      : 'from:me to:me';
    gvDriveSearch(query);
  }
  function gvWireSelfMail() {
    if (gvSelfWired) return;
    gvSelfWired = true;
    document.addEventListener('click', (e) => {
      const t = e.target;
      if (!t || !t.closest) return;
      if (t.closest('#gv-settings-page, [data-gv-settings-item]')) {
        return;
      }
      const host = t.closest(
        'a, button, [role="tab"], [role="button"], [role="link"], li');
      if (!host) return;
      const aria = (host.getAttribute('aria-label') || '').trim();
      const text = (host.textContent || '').trim()
        .replace(/\s+/g, ' ');
      if (!/^emails to myself$/i.test(aria) &&
          !/^emails to myself$/i.test(text)) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      gvRunSelfSearch();
    }, true);
  }

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

  const GV_PRESETS = [
    { id: 'v1', name: 'Lavender strip', vars: { bg: '#dbd4f0', hover: '#e6e1f7', fg: '#211b36', bar: '#6001d2', ring: null, badgeBg: '#6001d2', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null }, light: { bg: '#dbd4f0', hover: '#e2dbf5', fg: '#211b36', bar: '#6001d2', ring: null, badgeBg: '#6001d2', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null } },
    { id: 'v2', name: 'Paper', vars: { bg: '#eceae6', hover: '#f5f3ef', fg: '#1c1c1e', bar: '#26262c', ring: null, badgeBg: '#26262c', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null }, light: { bg: '#e6e1d8', hover: '#efeadf', fg: '#1c1c1e', bar: '#26262c', ring: null, badgeBg: '#26262c', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null } },
    { id: 'v3', name: 'Slate', vars: { bg: '#dfe3ea', hover: '#e9edf3', fg: '#17202b', bar: '#2f4a67', ring: null, badgeBg: '#2f4a67', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null }, light: { bg: '#d3dce8', hover: '#dde5ef', fg: '#17202b', bar: '#2f4a67', ring: null, badgeBg: '#2f4a67', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null } },
    { id: 'v4', name: 'Lifted dark (U4)', vars: { bg: '#262330', hover: '#2e2a3c', fg: '#f4f2fa', bar: '#8b7bb8', ring: null, badgeBg: '#3a2d5c', badgeFg: '#e9e4ff', dot: '#a78bfa', accent: null, readFg: null }, light: { bg: '#e9e6f5', hover: '#f0edf9', fg: '#241f38', bar: '#8b7bb8', ring: null, badgeBg: '#3a2d5c', badgeFg: '#e9e4ff', dot: '#7c5cd6', accent: null, readFg: null } },
    { id: 'v5', name: 'Outlook', vars: { bg: 'transparent', hover: 'rgba(255,255,255,0.04)', fg: '#e8f2fc', bar: '#4cc2ff', ring: null, badgeBg: '#1f4e79', badgeFg: '#cfe8ff', dot: 'transparent', accent: '#6cb5f5', readFg: null }, light: { bg: 'transparent', hover: 'rgba(15,23,42,0.04)', fg: '#1d2733', bar: '#0f6cbd', ring: null, badgeBg: '#1f4e79', badgeFg: '#ffffff', dot: 'transparent', accent: '#1f6fb2', readFg: null } },
    { id: 'v6', name: 'Outlook violet', vars: { bg: 'transparent', hover: 'rgba(255,255,255,0.04)', fg: '#efeaff', bar: '#8b7bb8', ring: null, badgeBg: '#3a2d5c', badgeFg: '#e9e4ff', dot: 'transparent', accent: '#b79cff', readFg: null }, light: { bg: 'transparent', hover: 'rgba(20,16,40,0.04)', fg: '#241f38', bar: '#8b7bb8', ring: null, badgeBg: '#3a2d5c', badgeFg: '#e9e4ff', dot: 'transparent', accent: '#6001d2', readFg: null } },
    { id: 'v7', name: 'Gmail surface', vars: { bg: '#2e2e33', hover: '#37373d', fg: '#ffffff', bar: 'transparent', ring: null, badgeBg: '#3f3f46', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: null }, light: { bg: '#ffffff', hover: '#f6f6f8', fg: '#1c1c1e', bar: 'transparent', ring: null, badgeBg: '#3f3f46', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: '#5f6368' } },
    { id: 'v8', name: 'Apple dot', vars: { bg: 'transparent', hover: 'rgba(255,255,255,0.04)', fg: '#f2f2f5', bar: 'transparent', ring: null, badgeBg: '#2c2c30', badgeFg: '#e8e8ec', dot: '#409cff', accent: null, readFg: null }, light: { bg: 'transparent', hover: 'rgba(0,0,0,0.03)', fg: '#1d1d21', bar: 'transparent', ring: null, badgeBg: '#e8e8ec', badgeFg: '#26262c', dot: '#0a84ff', accent: null, readFg: null } },
    { id: 'v9', name: 'Aubergine', vars: { bg: '#322a4f', hover: '#3b3260', fg: '#f5f2ff', bar: '#a78bfa', ring: null, badgeBg: '#4a3a75', badgeFg: '#efe9ff', dot: 'transparent', accent: null, readFg: null }, light: { bg: '#e3dcf7', hover: '#eae4fa', fg: '#241a45', bar: '#7c5cd6', ring: null, badgeBg: '#4a3a75', badgeFg: '#efe9ff', dot: 'transparent', accent: null, readFg: null } },
    { id: 'v10', name: 'Gold flag', vars: { bg: '#26262b', hover: '#2f2f34', fg: '#f7f4ec', bar: '#d8a03c', ring: null, badgeBg: '#453a1c', badgeFg: '#f3d489', dot: '#d8a03c', accent: null, readFg: null }, light: { bg: '#f6efdb', hover: '#faf5e6', fg: '#2b2413', bar: '#b57f1f', ring: null, badgeBg: '#453a1c', badgeFg: '#f3d489', dot: '#b57f1f', accent: null, readFg: null } },
    { id: 'v11', name: 'Carded', vars: { bg: '#1e1e24', hover: '#26262c', fg: '#f4f2fa', bar: '#8b7bb8', ring: 'rgba(255,255,255,0.13)', badgeBg: '#3a2d5c', badgeFg: '#e9e4ff', dot: 'transparent', accent: null, readFg: null }, light: { bg: '#ffffff', hover: '#f7f5fc', fg: '#241f38', bar: '#8b7bb8', ring: 'rgba(20,16,40,0.16)', badgeBg: '#3a2d5c', badgeFg: '#e9e4ff', dot: 'transparent', accent: null, readFg: null } },
    { id: 'v12', name: 'Type only', vars: { bg: 'transparent', hover: 'rgba(255,255,255,0.04)', fg: '#ffffff', bar: 'transparent', ring: null, badgeBg: '#26262c', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: 'rgba(235,235,240,0.45)' }, light: { bg: 'transparent', hover: 'rgba(0,0,0,0.03)', fg: '#17171c', bar: 'transparent', ring: null, badgeBg: '#26262c', badgeFg: '#ffffff', dot: 'transparent', accent: null, readFg: 'rgba(24,24,30,0.48)' } }
  ];
  const GV_VAR_MAP = { bg: '--gv-unread-bg', hover: '--gv-unread-bg-hover', fg: '--gv-unread-fg', bar: '--gv-unread-bar', ring: '--gv-unread-ring', badgeBg: '--gv-badge-bg', badgeFg: '--gv-badge-fg', dot: '--gv-unread-dot', accent: '--gv-unread-accent', readFg: '--gv-read-fg' };
  const GV_STORE_KEY = 'gvfix.settings.v1';
  function gvDefaultSettings() {
    return { style: 'v4', accent: '#6001d2', selfEmail: '', custom: { bg: '#322a4f', bar: '#a78bfa', useBar: true, useDot: true, text: 'auto' } };
  }
  function gvLoadSettings() {
    const d = gvDefaultSettings();
    try {
      const raw = localStorage.getItem(GV_STORE_KEY);
      if (!raw) return d;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.style === 'string') d.style = parsed.style;
        if (typeof parsed.accent === 'string' && gvHexRgb(parsed.accent)) d.accent = parsed.accent;
        if (typeof parsed.selfEmail === 'string') d.selfEmail = parsed.selfEmail;
        if (parsed.custom) {
          for (const k in d.custom) {
            if (parsed.custom[k] !== undefined) d.custom[k] = parsed.custom[k];
          }
        }
      }
    } catch (e) { /* storage unavailable - defaults rule */ }
    return d;
  }
  let gvSettings = gvLoadSettings();
  function gvSaveSettings() {
    try { localStorage.setItem(GV_STORE_KEY, JSON.stringify(gvSettings)); } catch (e) {}
  }
  function gvHexRgb(hex) {
    const m = String(hex).replace('#', '').match(/^([0-9a-f]{6})$/i);
    if (!m) return null;
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function gvLum(hex) {
    const rgb = gvHexRgb(hex);
    if (!rgb) return 0;
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  function gvShade(hex, amt) {
    const rgb = gvHexRgb(hex);
    if (!rgb) return hex;
    const t = amt > 0 ? 255 : 0;
    const q = Math.abs(amt);
    const c = rgb.map((v) => Math.round((t - v) * q) + v);
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function gvContrastFg(hex) { return gvLum(hex) > 0.32 ? '#211f26' : '#f5f3fa'; }
  function gvResolveVars(style, dark) {
    const which = style || gvSettings.style;
    if (which === 'custom') {
      const c = gvSettings.custom;
      const bg = gvHexRgb(c.bg) ? c.bg : '#322a4f';
      const bar = gvHexRgb(c.bar) ? c.bar : '#a78bfa';
      const fg = c.text === 'light' ? '#f5f3fa'
        : c.text === 'dark' ? '#211f26' : gvContrastFg(bg);
      const badgeBg = c.useBar ? bar : gvShade(bg, gvLum(bg) > 0.32 ? -0.18 : 0.18);
      return { bg: bg, hover: gvShade(bg, gvLum(bg) > 0.32 ? -0.05 : 0.07),
        fg: fg, bar: c.useBar ? bar : 'transparent', ring: null,
        badgeBg: badgeBg, badgeFg: gvContrastFg(badgeBg),
        dot: c.useDot ? bar : 'transparent', accent: null, readFg: null };
    }
    for (const p of GV_PRESETS) {
      if (p.id === which) return (dark === false && p.light) ? p.light : p.vars;
    }
    const d = GV_PRESETS[3];
    return (dark === false && d.light) ? d.light : d.vars;
  }
  const GV_ACCENT_BRAND = {
    '#6001d2': '--gv-accent', '#b79cff': '--gv-accent-soft',
    '#a78bfa': '--gv-accent-mid', '#8b7bb8': '--gv-accent-muted',
    '#d3cbea': '--gv-accent-pale'
  };
  function gvDesat(hex, q) {
    const rgb = gvHexRgb(hex);
    if (!rgb) return hex;
    const grey = Math.round(0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]);
    const c = rgb.map((v) => Math.round(v + (grey - v) * q));
    return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  function gvAccentPalette() {
    const base = gvHexRgb(gvSettings.accent) ? gvSettings.accent.toLowerCase() : '#6001d2';
    if (base === '#6001d2') {
      return { base: base, dark: '#4a01a8', mid: '#a78bfa',
        soft: '#b79cff', pale: '#d3cbea', muted: '#8b7bb8' };
    }
    return { base: base, dark: gvShade(base, -0.22),
      mid: gvShade(base, 0.35), soft: gvShade(base, 0.55),
      pale: gvShade(base, 0.80), muted: gvShade(gvDesat(base, 0.45), 0.08) };
  }
  function gvAccentVarRef(v) {
    if (typeof v !== 'string') return v;
    const ref = GV_ACCENT_BRAND[v.toLowerCase()];
    return ref ? 'var(' + ref + ')' : v;
  }
  function gvAccentHexMap(vars) {
    const pal = gvAccentPalette();
    const byRef = { '--gv-accent': pal.base, '--gv-accent-soft': pal.soft,
      '--gv-accent-mid': pal.mid, '--gv-accent-muted': pal.muted,
      '--gv-accent-pale': pal.pale };
    const out = {};
    for (const k in vars) {
      const v = vars[k];
      if (typeof v === 'string' && GV_ACCENT_BRAND[v.toLowerCase()]) {
        out[k] = byRef[GV_ACCENT_BRAND[v.toLowerCase()]];
      } else out[k] = v;
    }
    return out;
  }
  let gvThemeSig = null;
  function applyUnreadTheme() {
    const html = document.documentElement;
    const dark = html.classList.contains('gv-dark');
    const vars = gvResolveVars(gvSettings.style, dark);
    const pal = gvAccentPalette();
    const sig = (dark ? 'd' : 'l') + '|' + gvSettings.style + '|' +
      JSON.stringify(vars) + '|' + pal.base;
    if (sig === gvThemeSig) return;
    gvThemeSig = sig;
    html.style.setProperty('--gv-accent', pal.base);
    html.style.setProperty('--gv-accent-dark', pal.dark);
    html.style.setProperty('--gv-accent-mid', pal.mid);
    html.style.setProperty('--gv-accent-soft', pal.soft);
    html.style.setProperty('--gv-accent-pale', pal.pale);
    html.style.setProperty('--gv-accent-muted', pal.muted);
    const isCustom = gvSettings.style === 'custom';
    for (const k in GV_VAR_MAP) {
      let v = (vars[k] === undefined) ? null : vars[k];
      if (!isCustom) v = gvAccentVarRef(v);
      if (v === null || v === undefined) html.style.removeProperty(GV_VAR_MAP[k]);
      else html.style.setProperty(GV_VAR_MAP[k], v);
    }
    html.classList.toggle('gv-u-accent', !!vars.accent);
    gvAccEnsure();
  }
  const gvAccTouched = new Map();
  let gvAccObs = null;
  let gvAccQueue = [];
  let gvAccErrors = 0;
  let gvAccDead = false;
  function gvParseRgb(str) {
    const m = str && str.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function gvHsl(c) {
    const r = c.r / 255, g = c.g / 255, b = c.b / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const l = (mx + mn) / 2;
    if (mx === mn) return { h: 0, s: 0, l: l };
    const d = mx - mn;
    const sat = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    let h;
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (mx === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
    return { h: h, s: sat, l: l };
  }
  function gvIsYahooPurple(c) {
    if (!c || c.a < 0.15) return false;
    const hsl = gvHsl(c);
    return hsl.h >= 245 && hsl.h <= 295 && hsl.s >= 0.30 &&
      hsl.l >= 0.05 && hsl.l <= 0.97;
  }
  const GV_ACCENT_BUCKETS = ['--gv-accent-dark', '--gv-accent',
    '--gv-accent-mid', '--gv-accent-soft', '--gv-accent-pale'];
  function gvBucketIdx(l) {
    return l < 0.30 ? 0 : l < 0.48 ? 1 : l < 0.65 ? 2 : l < 0.83 ? 3 : 4;
  }
  function gvAccRec(el) {
    let rec = gvAccTouched.get(el);
    if (!rec) {
      rec = { prior: new Map(), cls: 0 };
      gvAccTouched.set(el, rec);
    }
    return rec;
  }
  // Paint one property, remembering its prior inline value the
  // first time we touch THAT property. Restores are per-property
  // legitimate later changes (the settings pane's display:none).
  // Reading the prior via getPropertyValue also resolves
  // shorthand origins (border, background) to the longhand.
  function gvAccSetProp(el, prop, value) {
    const rec = gvAccRec(el);
    if (!rec.prior.has(prop)) {
      rec.prior.set(prop, {
        v: el.style.getPropertyValue(prop),
        p: el.style.getPropertyPriority(prop),
      });
    }
    el.style.setProperty(prop, value, 'important');
  }
  function gvAccPaint(el, prop, varName) {
    gvAccSetProp(el, prop, 'var(' + varName + ')');
  }
  function gvAccUnpaint(el) {
    const rec = gvAccTouched.get(el);
    if (!rec) return;
    rec.prior.forEach((prior, prop) => {
      if (prior.v) el.style.setProperty(prop, prior.v, prior.p || '');
      else el.style.removeProperty(prop);
    });
    if (rec.cls & 1) el.classList.remove('gv-acc-bg');
    if (rec.cls & 2) el.classList.remove('gv-acc-pb');
    if (rec.cls & 4) el.classList.remove('gv-acc-pa');
    gvAccTouched.delete(el);
  }
  function gvAccExcludedRoot(el) {
    return el.nodeType === 1 && typeof el.matches === 'function' &&
      el.matches('[data-test-id^="message-list-item"], ' +
        '[data-test-id^="message-view"], #gv-settings-page, .gv-pv-row');
  }
  function gvAccExcluded(el) {
    if (typeof el.className === 'string' && el.className.indexOf('gv-') !== -1) return true;
    return !!el.closest('[data-test-id^="message-list-item"], ' +
      '[data-test-id^="message-view"], #gv-settings-page, .gv-pv-row');
  }
  // Substitute accent var references for purple colour tokens
  // inside a shadow / gradient string.
  function gvAccSubTokens(str) {
    if (!str || str.indexOf('rgb') === -1) return null;
    let changed = false;
    const out = str.replace(/rgba?\([^)]+\)/g, (tok) => {
      const c = gvParseRgb(tok);
      if (!gvIsYahooPurple(c)) return tok;
      changed = true;
      const ref = 'var(' + GV_ACCENT_BUCKETS[gvBucketIdx(gvHsl(c).l)] + ')';
      return c.a >= 0.99 ? ref
        : 'color-mix(in srgb, ' + ref + ' ' + Math.round(c.a * 100) + '%, transparent)';
    });
    return changed ? out : null;
  }
  // Identity discs keep their own colours, always: a small
  // round element carrying initials or a short count (mailbox
  // avatars and their count chips in Settings, account avatars)
  // is an identity colour like a sender avatar - never chrome.
  // A mailbox avatar that happens to be natively purple would
  // otherwise be repainted to accent shades while a non-purple
  // one escaped - identity discs are exempt, unconditionally.
  function gvAccIsIdentityDisc(el, cs) {
    if (el.querySelector('svg')) return false; // icon button
    const t = (el.textContent || '').trim();
    if (t.length > 3) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 12 || r.width > 56) return false;
    if (r.height < 12 || r.height > 56) return false;
    if (Math.abs(r.width - r.height) > 6) return false;
    const raw = cs.borderTopLeftRadius || '';
    const rad = parseFloat(raw) || 0;
    const round = raw.indexOf('%') !== -1
      ? rad >= 40 : rad >= r.width * 0.4;
    return round;
  }
  function gvAccProcessEl(el) {
    const tag = el.tagName;
    if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') return;
    if (gvAccExcluded(el)) return;
    gvAccRec(el); // register before any paint lands
    let cs;
    try { cs = getComputedStyle(el); } catch (e) { return; }
    if (gvAccIsIdentityDisc(el, cs)) return;
    const bg = gvParseRgb(cs.backgroundColor);
    if (gvIsYahooPurple(bg)) {
      const idx = gvBucketIdx(gvHsl(bg).l);
      const interactive = tag === 'BUTTON' || tag === 'A' ||
        el.getAttribute('role') === 'button';
      if (interactive) {
        gvAccSetProp(el, '--gv-acc-el', 'var(' + GV_ACCENT_BUCKETS[idx] + ')');
        gvAccSetProp(el, '--gv-acc-el-h',
          'var(' + GV_ACCENT_BUCKETS[Math.max(0, idx - 1)] + ')');
        el.classList.add('gv-acc-bg');
        gvAccRec(el).cls |= 1;
      } else {
        gvAccPaint(el, 'background-color', GV_ACCENT_BUCKETS[idx]);
      }
    }
    const fg = gvParseRgb(cs.color);
    if (gvIsYahooPurple(fg)) {
      gvAccPaint(el, 'color', GV_ACCENT_BUCKETS[gvBucketIdx(gvHsl(fg).l)]);
    }
    const sides = ['Top', 'Right', 'Bottom', 'Left'];
    for (const side of sides) {
      const w = parseFloat(cs['border' + side + 'Width']) || 0;
      if (w <= 0) continue;
      const bc = gvParseRgb(cs['border' + side + 'Color']);
      if (gvIsYahooPurple(bc)) {
        gvAccPaint(el, 'border-' + side.toLowerCase() + '-color',
          GV_ACCENT_BUCKETS[gvBucketIdx(gvHsl(bc).l)]);
      }
    }
    const shadow = gvAccSubTokens(cs.boxShadow);
    if (shadow) gvAccSetProp(el, 'box-shadow', shadow);
    const bgi = gvAccSubTokens(cs.backgroundImage);
    if (bgi) gvAccSetProp(el, 'background-image', bgi);
    if (el.namespaceURI === 'http://www.w3.org/2000/svg') {
      const fill = gvParseRgb(cs.fill);
      if (gvIsYahooPurple(fill)) {
        gvAccPaint(el, 'fill', GV_ACCENT_BUCKETS[gvBucketIdx(gvHsl(fill).l)]);
      }
    }
    // Pseudo-elements: the settings-nav tick and friends live
    // here - invisible to element-level checks. Probed only on
    // plausible chrome hosts (navs, lists, headers, buttons) to
    // keep the per-element cost down.
    if (!el.closest('nav, ul, ol, header, [role="tablist"], ' +
        '[role="navigation"]') && tag !== 'A' && tag !== 'BUTTON') return;
    for (const pseudo of ['::before', '::after']) {
      let pcs;
      try { pcs = getComputedStyle(el, pseudo); } catch (e) { continue; }
      if (!pcs || pcs.content === 'none' || pcs.content === 'normal') continue;
      const pbg = gvParseRgb(pcs.backgroundColor);
      if (gvIsYahooPurple(pbg)) {
        const v = GV_ACCENT_BUCKETS[gvBucketIdx(gvHsl(pbg).l)];
        const varName = pseudo === '::before' ? '--gv-acc-pb' : '--gv-acc-pa';
        gvAccSetProp(el, varName, 'var(' + v + ')');
        el.classList.add(pseudo === '::before' ? 'gv-acc-pb' : 'gv-acc-pa');
        gvAccRec(el).cls |= pseudo === '::before' ? 2 : 4;
      }
    }
  }
  // Walk a subtree with a hard element budget. The stack lives
  // on the queue item, so a huge subtree resumes across drains
  // instead of being dropped. Excluded roots (message rows
  // etc.) prune whole subtrees, so giant lists cost ~nothing.
  function gvAccWalk(item, budget) {
    if (!item.stack) item.stack = [item.root];
    let n = 0;
    while (item.stack.length && n < budget) {
      const el = item.stack.pop();
      if (!el || el.nodeType !== 1) continue;
      if (gvAccExcludedRoot(el)) continue;
      if (item.fresh && gvAccTouched.has(el)) gvAccUnpaint(el);
      if (!gvAccTouched.has(el)) { gvAccProcessEl(el); n++; }
      const kids = el.children;
      for (let i = kids.length - 1; i >= 0; i--) item.stack.push(kids[i]);
    }
    return item.stack.length === 0;
  }
  function gvAccDrain() {
    if (gvAccDead) { gvAccQueue.length = 0; return; }
    try {
      const deadline = performance.now() + 6;
      while (gvAccQueue.length) {
        const item = gvAccQueue[0];
        if (gvAccWalk(item, 220)) gvAccQueue.shift();
        if (performance.now() > deadline) break;
      }
    } catch (err) {
      gvAccFault();
    }
    if (gvAccQueue.length) setTimeout(gvAccDrain, 0);
  }
  function gvStripAccClasses(cls) {
    return (cls || '').split(/\s+/)
      .filter((t) => t && t.indexOf('gv-') !== 0).join(' ');
  }
  function gvAccFault() {
    gvAccErrors++;
    if (gvAccErrors >= 3) {
      gvAccDead = true;
      if (gvAccObs) { gvAccObs.disconnect(); gvAccObs = null; }
      gvAccentChromeRestore();
    }
  }
  // Re-verify just the chrome roots (headers, navs, tab bars).
  // Some Yahoo purple arrives with asynchronously loaded
  // stylesheets - the DOM never mutates, so the incremental
  // observer alone never re-checks those elements (the header
  function gvAccQueueChromeRoots() {
    if (gvAccDead || gvAccentPalette().base === '#6001d2') return;
    const roots = document.querySelectorAll(
      'header, nav, [role="banner"], [role="navigation"], ' +
      '[role="tablist"], [data-test-id*="toolbar" i], ' +
      '[data-test-id*="header" i]');
    roots.forEach((r) => gvAccQueue.push({ root: r, fresh: true }));
    if (roots.length) gvAccDrain();
  }
  let gvAccNetTimer = null;
  let gvAccLoadWired = false;
  function gvAccOnMutations(records) {
    if (gvAccDead) return;
    try {
      for (const rec of records) {
        if (rec.type === 'childList') {
          let styleChanged = rec.target &&
            (rec.target.tagName === 'STYLE' || rec.target.tagName === 'LINK');
          rec.addedNodes.forEach((node) => {
            if (node.nodeType !== 1) return;
            if (node.tagName === 'STYLE' || node.tagName === 'LINK') {
              styleChanged = true;
            }
            gvAccQueue.push({ root: node, fresh: false });
          });
          if (styleChanged) gvAccQueueChromeRoots();
        } else if (rec.type === 'attributes' && rec.target) {
          // Skip class changes that are only our own gv-* classes
          // landing (our painting must not retrigger itself -
          // without this guard the layer loops forever).
          const now = gvStripAccClasses(rec.target.getAttribute &&
            rec.target.getAttribute('class'));
          const was = gvStripAccClasses(rec.oldValue);
          if (now !== was) {
            gvAccQueue.push({ root: rec.target, fresh: true });
          }
        }
      }
      if (gvAccQueue.length) gvAccDrain();
    } catch (err) {
      gvAccFault();
    }
  }
  function gvAccentChromeRestore() {
    const els = Array.from(gvAccTouched.keys());
    for (const el of els) gvAccUnpaint(el);
    gvAccTouched.clear();
  }
  function gvAccEnsure() {
    if (gvAccDead) return;
    const active = gvAccentPalette().base !== '#6001d2';
    if (!active) {
      if (gvAccObs) { gvAccObs.disconnect(); gvAccObs = null; }
      if (gvAccTouched.size) gvAccentChromeRestore();
      gvAccQueue.length = 0;
      if (gvAccNetTimer) { clearInterval(gvAccNetTimer); gvAccNetTimer = null; }
      return;
    }
    if (!gvAccObs && document.documentElement) {
      gvAccObs = new MutationObserver(gvAccOnMutations);
      gvAccObs.observe(document.documentElement, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ['class'],
        attributeOldValue: true,
      });
      if (document.body) gvAccQueue.push({ root: document.body, fresh: false });
      gvAccDrain();
    }
    if (!gvAccLoadWired) {
      gvAccLoadWired = true;
      // External stylesheets landing late recolour chrome with
      // no DOM mutation at all - recheck the chrome roots then.
      document.addEventListener('load', (ev) => {
        if (ev.target && ev.target.tagName === 'LINK') {
          gvAccQueueChromeRoots();
        }
      }, true);
    }
    if (!gvAccNetTimer) {
      gvAccNetTimer = setInterval(gvAccQueueChromeRoots, 20000);
    }
  }
  // Kept as the entry point the settings wiring calls: accent
  // changes repaint through the var() references on their own;
  // all this has to do is start/stop the layer and restore on
  // reset (both handled inside gvAccEnsure).
  function gvAccentChromeScan(force) {
    void force;
    gvAccEnsure();
    gvAccQueueChromeRoots();
  }
  const GV_SETTINGS_LABELS = ['Appearance', 'Inbox categories', 'Mailboxes',
    'Notifications', 'Contacts', 'Writing email', 'Viewing email', 'Filters',
    'AI features', 'Security and privacy', 'Vacation response'];
  let gvNavItem = null;
  let gvPageEl = null;
  let gvHiddenPane = null;
  let gvSelRestoreItem = null;
  let gvSelDiff = null;       // full subtree selected-vs-plain diff
  let gvPageOpen = false;

  function gvFindLabelLeaf(root, label) {
    const els = root.querySelectorAll('span, a, button, li, div');
    for (const el of els) {
      if (el.children.length === 0 &&
          (el.textContent || '').trim() === label) return el;
    }
    return null;
  }
  function gvItemLabel(item) {
    for (const lab of GV_SETTINGS_LABELS) {
      if (gvFindLabelLeaf(item, lab)) return lab;
    }
    if (gvFindLabelLeaf(item, 'Unread style')) return 'Unread style';
    return null;
  }
  function gvNavItemOf(leaf) {
    let item = leaf;
    while (item && item.parentElement) {
      const parent = item.parentElement;
      let sibs = 0;
      for (const child of parent.children) {
        if (GV_SETTINGS_LABELS.some((l) => gvFindLabelLeaf(child, l))) sibs++;
      }
      if (sibs >= 2) return item;
      item = item.parentElement;
    }
    return null;
  }
  function gvInSettingsNav(el) {
    if (!el) return false;
    const nav = gvFindSettingsNav();
    return !!(nav && nav.list.contains(el));
  }
  function gvFindSettingsNav() {
    for (const lab of ['Filters', 'Mailboxes', 'Appearance']) {
      const leaf = gvFindLabelLeaf(document, lab);
      if (!leaf) continue;
      const item = gvNavItemOf(leaf);
      if (item && item.parentElement) {
        const items = Array.from(item.parentElement.children)
          .filter((c) => GV_SETTINGS_LABELS.some((l) => gvFindLabelLeaf(c, l)));
        if (items.length >= 5) return { list: item.parentElement, items: items };
      }
    }
    return null;
  }
  function gvClassDelta(a, b) {
    const bs = new Set(b.classList);
    return Array.from(a.classList).filter((c) => !bs.has(c));
  }
  function gvNodeSig(el) {
    return el.tagName + '.' + Array.from(el.classList).join('.');
  }
  function gvLabelLeafOf(item) {
    for (const lab of GV_SETTINGS_LABELS) {
      const leaf = gvFindLabelLeaf(item, lab);
      if (leaf) return leaf;
    }
    return gvFindLabelLeaf(item, 'Unread style');
  }
  function gvDetectSelected(items) {
    for (const it of items) {
      if (it.getAttribute('aria-current') ||
          it.getAttribute('aria-selected') === 'true' ||
          it.querySelector('[aria-current], [aria-selected="true"]')) return it;
    }
    let best = null;
    let bestScore = -1;
    for (const it of items) {
      const leaf = gvLabelLeafOf(it);
      if (!leaf) continue;
      const cs = getComputedStyle(leaf);
      const w = parseInt(cs.fontWeight, 10) || 400;
      const m = cs.color.match(/[\d.]+/g);
      const bright = m ? (+m[0] + +m[1] + +m[2]) : 0;
      const score = w * 1000 + bright;
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return best;
  }
  function gvNodeByPath(root, path) {
    let el = root;
    if (!path) return el;
    const parts = path.split('/');
    for (const i of parts) {
      if (!el) return null;
      el = el.children[+i];
    }
    return el || null;
  }
  function gvDiffNodes(sel, plain, path, out) {
    const selCls = new Set(sel.classList);
    const plainCls = new Set(plain.classList);
    const selOnly = Array.from(selCls).filter((c) => !plainCls.has(c));
    const plainOnly = Array.from(plainCls).filter((c) => !selCls.has(c));
    const attrs = [];
    const names = new Set([].concat(
      Array.from(sel.getAttributeNames()),
      Array.from(plain.getAttributeNames())));
    names.forEach((n) => {
      if (n === 'class' || n === 'style' || n === 'id') return;
      const sv = sel.getAttribute(n);
      const pv = plain.getAttribute(n);
      if (sv !== pv) attrs.push({ name: n, sel: sv, plain: pv });
    });
    if (selOnly.length || plainOnly.length || attrs.length) {
      out.entries.push({ path: path, selOnly: selOnly,
        plainOnly: plainOnly, attrs: attrs });
    }
    // pairing breaks the moment the selected item carries one
    // extra node (its tick): every later sibling shifts and the
    // label span gets paired with the tick - the transfer then
    // grafts a copy of the label and mangles the diff.
    const ac = sel.children;
    const bc = plain.children;
    const usedB = new Set();
    const pair = (aEl, bEl) => {
      let score = 0;
      if (aEl.tagName === bEl.tagName) score += 2;
      const at = (aEl.textContent || '').trim();
      const bt = (bEl.textContent || '').trim();
      if (at && at === bt) score += 3;
      if (!at && !bt) score += 1;
      aEl.classList.forEach((c) => {
        if (bEl.classList.contains(c)) score += 1;
      });
      return score;
    };
    // Two passes: confident pairs first (same text or strong
    // class overlap), then weak tag-only pairs - otherwise an
    // extra node (the tick) steals the label span's partner on
    // a bare tag match and the label becomes a bogus "extra".
    const paired = new Array(ac.length).fill(-1);
    for (const minScore of [4, 2]) {
      for (let i = 0; i < ac.length; i++) {
        if (paired[i] !== -1) continue;
        let bestJ = -1;
        let bestScore = minScore - 1;
        for (let j = 0; j < bc.length; j++) {
          if (usedB.has(j)) continue;
          const sc = pair(ac[i], bc[j]);
          if (sc > bestScore) { bestScore = sc; bestJ = j; }
        }
        if (bestJ !== -1) { paired[i] = bestJ; usedB.add(bestJ); }
      }
    }
    for (let i = 0; i < ac.length; i++) {
      if (paired[i] === -1) {
        out.extras.push({ parentPath: path, sig: gvNodeSig(ac[i]),
          html: ac[i].outerHTML });
      } else {
        gvDiffNodes(ac[i], bc[paired[i]],
          path ? path + '/' + paired[i] : '' + paired[i], out);
      }
    }
  }
  function gvComputeSelDelta(selected, plain) {
    const out = { entries: [], extras: [] };
    gvDiffNodes(selected, plain, '', out);
    gvSelDiff = out;
  }
  function gvApplySelectedLook(item, on) {
    if (!item || !gvSelDiff) return;
    for (const e of gvSelDiff.entries) {
      const el = gvNodeByPath(item, e.path);
      if (!el) continue;
      e.selOnly.forEach((c) => el.classList.toggle(c, on));
      e.plainOnly.forEach((c) => el.classList.toggle(c, !on));
      for (const a of e.attrs) {
        const v = on ? a.sel : a.plain;
        if (v === null || v === undefined) el.removeAttribute(a.name);
        else el.setAttribute(a.name, v);
      }
    }
    // Selected-only extra nodes (e.g. a tick that exists only on
    // the selected item). Ours were grafted at build time and are
    // toggled by marker; Yahoo's own are matched by signature,
    // anything carrying text.
    const ours = item.hasAttribute('data-gv-settings-item');
    const leafEl = gvLabelLeafOf(item);
    const extraSigs = gvSelDiff.extras.map((x) => x.sig);
    item.querySelectorAll(ours ? '[data-gv-extra]' : '*')
      .forEach((el) => {
        if (!ours) {
          if (extraSigs.indexOf(gvNodeSig(el)) === -1) return;
          if (leafEl && (el === leafEl || el.contains(leafEl))) return;
          if ((el.textContent || '').trim().length > 0) return;
        }
        if (on) {
          if (el.__gvDisp !== undefined) el.style.display = el.__gvDisp;
        } else {
          if (el.__gvDisp === undefined) el.__gvDisp = el.style.display;
          el.style.display = 'none';
        }
      });
  }
  function gvBuildNavItem(nav) {
    const selected = gvDetectSelected(nav.items) || nav.items[0];
    const plain = nav.items.find((i) => i !== selected) || nav.items[0];
    gvComputeSelDelta(selected, plain);
    // Clone an UNSELECTED item: born plain, nothing to strip.
    const clone = plain.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    clone.setAttribute('data-gv-settings-item', '1');
    // Graft selected-only extras (appended - Yahoo positions its
    // tick by CSS, and appending never shifts diff paths).
    for (const ex of gvSelDiff.extras) {
      const tmp = document.createElement('div');
      tmp.innerHTML = ex.html;
      const node = tmp.firstElementChild;
      if (!node) continue;
      node.removeAttribute('id');
      node.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      node.setAttribute('data-gv-extra', '1');
      const parent = gvNodeByPath(clone, ex.parentPath);
      if (parent) parent.appendChild(node);
    }
    const leaf = gvLabelLeafOf(clone);
    clone.querySelectorAll('*').forEach((el) => {
      if (el.children.length === 0 && el !== leaf) {
        const t = (el.textContent || '').trim();
        if (/^\d+$/.test(t) || /^y\+$/i.test(t)) el.remove();
      }
    });
    if (leaf) leaf.textContent = 'Unread style';
    gvNavItem = clone;
    gvApplySelectedLook(clone, false); // extras hidden until active
    clone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      openGVSettingsPage();
    }, true);
    const viewing = nav.items.find((i) => gvFindLabelLeaf(i, 'Viewing email'));
    if (viewing && viewing.parentElement === nav.list) {
      nav.list.insertBefore(clone, viewing.nextSibling);
    } else {
      nav.list.appendChild(clone);
    }
    return clone;
  }
  function gvSectionTitleEl(nav) {
    const els = document.querySelectorAll(
      'h1, h2, h3, [role="heading"], div, span');
    for (const el of els) {
      if (nav.list.contains(el)) continue;
      if (el.children.length > 1) continue;
      const t = (el.textContent || '').trim();
      if (GV_SETTINGS_LABELS.indexOf(t) === -1) continue;
      if (!el.getClientRects().length) continue;
      const tag = el.tagName;
      if (tag !== 'H1' && tag !== 'H2' && tag !== 'H3' &&
          el.getAttribute('role') !== 'heading') {
        const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
        if (fs < 19) continue;
      }
      return el;
    }
    return null;
  }
  function gvPaneByTitle(nav) {
    const title = gvSectionTitleEl(nav);
    if (!title) return null;
    let root = title;
    while (root.parentElement && root.parentElement !== document.body) {
      const parent = root.parentElement;
      if (parent.contains(nav.list)) break;
      const pw = parent.getBoundingClientRect().width;
      const rw = root.getBoundingClientRect().width;
      if (rw > 0 && pw > rw * 2.4) break;
      root = parent;
    }
    if (root.getBoundingClientRect().width < window.innerWidth * 0.38) {
      return null;
    }
    return { pane: root };
  }
  function gvPaneByGeometry(nav) {
    // The wide, tall, non-nav branch of the settings container,
    // at the LOWEST level that offers one.
    let node = nav.list;
    while (node.parentElement && node.parentElement !== document.body) {
      const parent = node.parentElement;
      let best = null;
      for (const child of parent.children) {
        if (child === node || child.contains(nav.list)) continue;
        if (!child.getClientRects().length) continue;
        const r = child.getBoundingClientRect();
        if (r.width >= window.innerWidth * 0.38 && r.height >= 180) {
          const area = r.width * r.height;
          if (!best || area > best.area) best = { pane: child, area: area };
        }
      }
      if (best) return best;
      node = parent;
    }
    return null;
  }
  function gvFindContentPane(nav) {
    return gvPaneByTitle(nav) || gvPaneByGeometry(nav);
  }
  function gvPreviewHTML(id, name, vars) {
    // 'transparent' means "the list shows through" - stand in the
    // CURRENT theme's list colour, never the other theme's.
    const listBg = document.documentElement.classList.contains('gv-dark')
      ? '#101014' : '#f5f5f7';
    const bg = vars.bg === 'transparent' ? listBg : vars.bg;
    const bar = vars.bar === 'transparent' ? 'transparent' : vars.bar;
    const fg = vars.accent || vars.fg;
    return '<button type="button" class="gv-s-tile" data-gv-style="' + id + '">' +
      '<span class="gv-s-prev">' +
      '<span class="gv-s-u" style="background:' + bg +
      ';border-left:4px solid ' + bar + ';color:' + fg + '">Clopay Corp - Access Restored</span>' +
      '<span class="gv-s-r">LiftMaster - Your invoice is ready</span>' +
      '</span>' +
      '<span class="gv-s-name">' + name + '<span class="gv-check">&#10003;</span></span>' +
      '</button>';
  }
  function gvPvRow(o) {
    const dot = '<span data-test-id="unread-indicator"><button type="button" tabindex="-1" aria-hidden="true"><span style="display:block;width:8px;height:8px;border-radius:50%;background:var(--gv-accent,#6001d2)"></span></button></span>';
    return '<div class="gv-pv-row" data-test-id="message-list-item" aria-label="' + o.aria + '">' +
      (o.unread ? dot : '<span style="width:26px;flex:none"></span>') +
      '<span class="gv-pv-av" style="background:' + o.avc + '">' + o.av + '</span>' +
      '<span class="gv-pv-who"' + (o.unread ? ' style="font-weight:700"' : '') + '>' + o.who + '</span>' +
      (o.chip ? '<span class="gv-pv-chip"><span>Inbox</span></span>' : '') +
      '<span class="gv-pv-what"><span' + (o.unread ? ' style="font-weight:700"' : '') + '>' + o.subj + '</span> <span class="gv-pv-snip">&middot; ' + o.snip + '</span></span>' +
      '<span class="gv-pv-when"' + (o.unread ? ' style="font-weight:700"' : '') + '>' + o.when + '</span>' +
      '</div>';
  }
  function gvTilesHTML() {
    const darkNow = document.documentElement.classList.contains('gv-dark');
    let tiles = '';
    for (const p of GV_PRESETS) {
      tiles += gvPreviewHTML(p.id, p.name,
        gvAccentHexMap(gvResolveVars(p.id, darkNow)));
    }
    tiles += gvPreviewHTML('custom', 'Custom', gvResolveVars('custom'));
    return tiles;
  }
  function gvSettingsPageHTML() {
    const preview =
      gvPvRow({ unread: 1, aria: 'Unread: Clopay Corporation, Access Restored to All Clopay Portals', av: 'CC', avc: '#5b7fa6', who: 'Clopay Corporation', chip: 1, subj: 'Access Restored to All Clopay Portals', snip: 'Open for details', when: '2:40 PM' }) +
      gvPvRow({ unread: 1, aria: 'Unread: electrical@bifold.com, Re: Hangar Motor', av: 'EL', avc: '#7a6ff0', who: 'electrical@bifold.com', chip: 0, subj: 'Re: Hangar Motor', snip: 'Send me the door size when you have it.', when: 'Oct 20' }) +
      gvPvRow({ unread: 0, aria: 'LiftMaster, Your invoice is ready', av: 'LM', avc: '#4c7a57', who: 'LiftMaster', chip: 0, subj: 'Your invoice is ready', snip: 'View and pay your balance in the portal', when: 'Oct 20' }) +
      gvPvRow({ unread: 0, aria: 'Alicia Kahler, Estimate follow-up', av: 'AK', avc: '#8a5a44', who: 'Alicia Kahler', chip: 0, subj: 'Estimate follow-up', snip: 'Circling back on the door quote', when: 'Oct 19' });
    return '<div class="gv-s-wrap">' +
      '<div class="gv-s-title">Unread style</div>' +
      '<p class="gv-s-sub">Make unread mail unmistakable. Pick a treatment or build your own - changes apply instantly and are saved on this computer.</p>' +
      '<div class="gv-s-cols">' +
      '<div class="gv-s-main">' +
      '<div class="gv-s-sect">Preset</div>' +
      '<div class="gv-s-grid">' + gvTilesHTML() + '</div>' +
      '<div class="gv-s-sect">Custom</div>' +
      '<div class="gv-s-card">' +
      '<div class="gv-s-row"><span>Row colour</span><input type="color" id="gv-c-bg"></div>' +
      '<div class="gv-s-row"><span>Edge bar</span><span style="display:flex;align-items:center;gap:9px"><input type="checkbox" id="gv-c-usebar"><input type="color" id="gv-c-bar"></span></div>' +
      '<div class="gv-s-row"><span>Unread dot</span><input type="checkbox" id="gv-c-usedot"></div>' +
      '<div class="gv-s-row"><span>Text</span><span class="gv-seg">' +
      '<button type="button" data-gv-text="auto">Auto</button>' +
      '<button type="button" data-gv-text="light">Light</button>' +
      '<button type="button" data-gv-text="dark">Dark</button></span></div>' +
      '</div>' +
      '<div class="gv-s-sect">Accent colour</div>' +
      '<div class="gv-s-card">' +
      '<div class="gv-s-row"><span>Global accent</span><span style="display:flex;align-items:center;gap:9px"><button type="button" class="gv-a-reset" id="gv-a-reset">Yahoo purple</button><input type="color" id="gv-a-color"></span></div>' +
      '</div>' +
      '<div class="gv-s-sect">Emails to Myself</div>' +
      '<div class="gv-s-card">' +
      '<div class="gv-s-row"><span>Your email address</span><input type="text" class="gv-s-textin" id="gv-self-email" placeholder="you@yahoo.com" autocomplete="off" spellcheck="false"></div>' +
      '</div>' +
      '<p class="gv-s-note">Yahoo locks its own Emails to Myself tab behind Mail Plus. This script takes the tab over instead: clicking it runs a Yahoo search for mail from and to this address - the same list, no Plus. The address is auto-detected from your account when possible; type it here to override.</p>' +
      '<p class="gv-s-note">The accent recolours everything purple in the interface - badges, bars, buttons, icons and hovers, Yahoo\'s own chrome included. Sender avatars and message content are never touched. Styles apply in both Yahoo themes; every preset has a light and a dark translation. Added by Yahoo Mail Classic Fix.</p>' +
      '</div>' +
      '<div class="gv-s-side">' +
      '<div class="gv-s-sect">Live preview</div>' +
      '<div class="gv-s-preview">' +
      '<div class="gv-s-pv-head"><span>Inbox</span><span class="gv-s-pv-tag">your inbox, with the current choice</span></div>' +
      '<div class="gv-s-pv-list">' + preview + '</div>' +
      '</div>' +
      '<p class="gv-s-pv-note">This preview is live: these are real message rows, classified and painted by the same code as your inbox. What you see here is exactly what the list gets.</p>' +
      '</div>' +
      '</div>' +
      '</div>';
  }
  function refreshSettingsPage() {
    const page = gvPageEl;
    if (!page) return;
    const grid = page.querySelector('.gv-s-grid');
    if (grid) {
      grid.innerHTML = gvTilesHTML();
      wireSettingsTiles(page);
    }
    // Mark AFTER the rebuild: fresh nodes start unmarked.
    page.querySelectorAll('.gv-s-tile').forEach((t) => {
      t.classList.toggle('gv-sel',
        t.getAttribute('data-gv-style') === gvSettings.style);
    });
    const c = gvSettings.custom;
    const bgIn = page.querySelector('#gv-c-bg');
    const barIn = page.querySelector('#gv-c-bar');
    const barT = page.querySelector('#gv-c-usebar');
    const dotT = page.querySelector('#gv-c-usedot');
    if (bgIn) bgIn.value = gvHexRgb(c.bg) ? c.bg : '#322a4f';
    if (barIn) barIn.value = gvHexRgb(c.bar) ? c.bar : '#a78bfa';
    if (barT) barT.checked = !!c.useBar;
    if (dotT) dotT.checked = !!c.useDot;
    page.querySelectorAll('.gv-seg button').forEach((b) => {
      b.classList.toggle('gv-on', b.getAttribute('data-gv-text') === c.text);
    });
    const accIn = page.querySelector('#gv-a-color');
    if (accIn) accIn.value = gvAccentPalette().base;
  }
  function wireSettingsTiles(page) {
    page.querySelectorAll('.gv-s-tile').forEach((t) => {
      if (t.__gvWired) return;
      t.__gvWired = true;
      t.addEventListener('click', () => {
        gvSettings.style = t.getAttribute('data-gv-style');
        gvSaveSettings();
        applyUnreadTheme();
        refreshSettingsPage();
      });
    });
  }
  function gvCustomTouched() {
    gvSettings.style = 'custom';
    gvSaveSettings();
    applyUnreadTheme();
    refreshSettingsPage();
  }
  function wireSettingsPage(page) {
    wireSettingsTiles(page);
    page.querySelector('#gv-c-bg').addEventListener('input', (e) => {
      gvSettings.custom.bg = e.target.value;
      gvCustomTouched();
    });
    page.querySelector('#gv-c-bar').addEventListener('input', (e) => {
      gvSettings.custom.bar = e.target.value;
      gvCustomTouched();
    });
    page.querySelector('#gv-c-usebar').addEventListener('change', (e) => {
      gvSettings.custom.useBar = e.target.checked;
      gvCustomTouched();
    });
    page.querySelector('#gv-c-usedot').addEventListener('change', (e) => {
      gvSettings.custom.useDot = e.target.checked;
      gvCustomTouched();
    });
    page.querySelectorAll('.gv-seg button').forEach((b) => {
      b.addEventListener('click', () => {
        gvSettings.custom.text = b.getAttribute('data-gv-text');
        touchCustom();
      });
    });
    const accIn = page.querySelector('#gv-a-color');
    if (accIn) {
      accIn.addEventListener('input', () => {
        gvSettings.accent = accIn.value;
        gvSaveSettings();
        applyUnreadTheme();
        gvAccentChromeScan(true);
        refreshSettingsPage();
      });
    }
    const accReset = page.querySelector('#gv-a-reset');
    if (accReset) {
      accReset.addEventListener('click', () => {
        gvSettings.accent = '#6001d2';
        gvSaveSettings();
        applyUnreadTheme();
        gvAccentChromeScan(true);
        refreshSettingsPage();
      });
    }
    const selfIn = page.querySelector('#gv-self-email');
    if (selfIn) {
      selfIn.value = gvSettings.selfEmail || gvSelfAddress() || '';
      selfIn.addEventListener('change', () => {
        gvSettings.selfEmail = selfIn.value.trim();
        gvSaveSettings();
      });
    }
  }
  function openGVSettingsPage() {
    try {
      const nav = gvFindSettingsNav();
      if (!nav) return;
      const found = gvFindContentPane(nav);
      closeGVSettingsPage();
      gvPageEl = document.createElement('div');
      gvPageEl.id = 'gv-settings-page';
      gvPageEl.innerHTML = gvSettingsPageHTML();
      if (found && found.pane && found.pane.parentElement) {
        gvHiddenPane = found.pane;
        gvHiddenPane.__gvOldDisplay = gvHiddenPane.style.display;
        gvHiddenPane.style.display = 'none';
        found.pane.parentElement.insertBefore(
          gvPageEl, found.pane.nextSibling);
      } else {
        // Last resort: overlay the content region beside the nav
        // column, on a sampled Yahoo surface colour.
        let col = nav.list;
        while (col.parentElement && col.parentElement !== document.body &&
               col.parentElement.getBoundingClientRect().width <=
                 col.getBoundingClientRect().width + 48) {
          col = col.parentElement;
        }
        const r = col.getBoundingClientRect();
        let bg = '#1e1e22';
        let probe = col;
        while (probe && probe !== document.body) {
          const b = getComputedStyle(probe).backgroundColor;
          if (b && b !== 'rgba(0, 0, 0, 0)' && b !== 'transparent') {
            bg = b;
            break;
          }
          probe = probe.parentElement;
        }
        gvPageEl.style.cssText = 'position:fixed;top:' +
          Math.max(0, r.top) + 'px;left:' + r.right +
          'px;right:10px;bottom:10px;overflow:auto;' +
          'z-index:2147483000;background:' + bg +
          ';border-left:1px solid rgba(255,255,255,0.10);' +
          'box-shadow:-18px 0 44px rgba(0,0,0,0.5)';
        document.body.appendChild(gvPageEl);
        gvHiddenPane = null;
      }
      wireSettingsPage(gvPageEl);
      refreshSettingsPage();
      gvPageOpen = true;
      const sel = gvDetectSelected(nav.items);
      if (sel && sel !== gvNavItem) {
        gvSelRestoreItem = sel;
        gvApplySelectedLook(sel, false);
      }
      if (gvNavItem) gvApplySelectedLook(gvNavItem, true);
    } catch (err) {
      // Never leave Yahoo's UI half-switched.
      closeGVSettingsPage();
    }
  }
  function closeGVSettingsPage() {
    if (gvPageEl) { gvPageEl.remove(); gvPageEl = null; }
    if (gvHiddenPane) {
      gvHiddenPane.style.display = gvHiddenPane.__gvOldDisplay || '';
      gvHiddenPane = null;
    }
    if (gvSelRestoreItem) {
      gvApplySelectedLook(gvSelRestoreItem, true);
      gvSelRestoreItem = null;
    }
    if (gvNavItem && gvNavItem.isConnected) {
      gvApplySelectedLook(gvNavItem, false);
    }
    gvPageOpen = false;
  }
  let gvNavDocWired = false;
  function syncSettingsNav() {
    if (!gvNavDocWired) {
      gvNavDocWired = true;
      document.addEventListener('click', (e) => {
        if (!gvPageOpen) return;
        const item = e.target.closest('[data-gv-settings-item]');
        if (item) return; // our own item handles itself
        // a click on any real settings nav item closes our page
        const nav = gvFindSettingsNav();
        if (nav && nav.list.contains(e.target)) closeGVSettingsPage();
      }, true);
    }
    if (gvNavItem && gvNavItem.isConnected) {
      if (gvPageOpen && (!gvPageEl || !gvPageEl.isConnected)) {
        openGVSettingsPage();
      }
      return;
    }
    gvNavItem = null;
    const nav = gvFindSettingsNav();
    if (!nav) {
      if (gvPageOpen) closeGVSettingsPage();
      return;
    }
    gvBuildNavItem(nav);
    if (gvPageOpen) openGVSettingsPage();
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
  let gvSelfLastTry = -10000;
  function run() { queued = false; detectDark(); applyUnreadTheme(); syncSettingsNav(); hideBadgeAdRows(); tagRows(); tagAdsAndRail(); hideUpsells(); syncInboxBadge(); syncUnreadPromotion(); if (!gvSettings.selfEmail && performance.now() - gvSelfLastTry > 5000) { gvSelfLastTry = performance.now(); gvSelfAddress(); } }
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  }

  gvWireSelfMail();
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
