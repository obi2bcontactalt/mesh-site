// Page templates. Plain functions that return HTML strings.
// Shared pieces sit at the top; one function per page type below.

import { hijri as hijriOf } from './lib/dates.mjs';
const hijriText = (iso) => hijriOf(iso).text;

export const esc = (s = '') => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ar = (text, cls = '') => text ? `<span class="ar ${cls}" lang="ar" dir="rtl">${esc(text)}</span>` : '';

const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wght@100..900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap';

// ---------- icons (inline SVG, 24px grid, stroke = currentColor) ----------

const icon = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  theme: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" class="fill"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.3"/></svg>',
};

// ---------- the lattice (the pattern from the MESH logo) ----------

// Square grid + diamonds in alternate cells. One tile = 2×2 cells (192 units).
const D = 68;
const centers = [[48, 48], [144, 144], [240, 48], [48, 240], [240, 240], [-48, 144], [144, -48], [-48, -48]];
const diamonds = centers.map(([x, y]) => `M${x} ${y - D}L${x + D} ${y}L${x} ${y + D}L${x - D} ${y}Z`).join('');
export const LATTICE_PATH = `M0 0H192M0 96H192M0 192H192M0 0V192M96 0V192M192 0V192${diamonds}`;

function latticeDefs(id, cell = 48) {
  const s = cell * 2;
  return `<pattern id="${id}" width="${s}" height="${s}" patternUnits="userSpaceOnUse"><path d="${LATTICE_PATH}" transform="scale(${s / 192})" class="lattice-line"/></pattern>`;
}

// ---------- layout ----------

function head(ctx, { title, description, depth, ogPath = '' }) {
  const { site, link, PREVIEW, assetVersion } = ctx;
  const root = link(depth, '').replace(/index\.html$/, '');
  const base = (site.url || '').replace(/\/$/, '');
  const og = !PREVIEW && base ? `
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${base}/${ogPath}">
<meta property="og:image" content="${base}/assets/img/mesh-logo.jpg">
<meta name="twitter:card" content="summary">
<link rel="canonical" href="${base}/${ogPath}">` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>${PREVIEW ? '\n<meta name="claude:viewport-fit-sides" content="cover">\n<meta name="mesh-preview" content="1">' : ''}
<meta name="description" content="${esc(description)}">
<meta name="mesh-root" content="${root}">
<meta name="theme-color" content="#0F5A3B">${og}
<link rel="icon" href="${root}assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<link rel="stylesheet" href="${root}assets/site.css?v=${assetVersion}">
<script>(function(){try{var t=localStorage.getItem('mesh-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()</script>
<script src="${root}assets/site.js?v=${assetVersion}" defer></script>
</head>`;
}

function header(ctx, depth, current) {
  const { link } = ctx;
  const nav = [['calendar/', 'Calendar'], ['study/', 'Study'], ['restaurants/', 'Restaurants'], ['about/', 'About']]
    .map(([k, label]) => `<a href="${link(depth, k)}"${current === k ? ' aria-current="page"' : ''}>${label}</a>`).join('');
  return `<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${link(depth, '')}" aria-label="MESH home">MESH</a>
    <nav class="header-nav" aria-label="Main">${nav}</nav>
    <div class="header-actions">
      <button type="button" class="icon-btn" data-open-search aria-label="Search MESH">${icon.search}</button>
      <button type="button" class="icon-btn" data-theme-toggle aria-label="Switch theme">${icon.theme}</button>
      <a class="btn btn-gold btn-small header-ask" href="${link(depth, 'ask/')}">Ask</a>
      <button type="button" class="icon-btn menu-btn" data-open-menu aria-label="Open menu" aria-controls="menu">${icon.menu}</button>
    </div>
  </div>
</header>`;
}

function footer(ctx, depth) {
  const { link, topics } = ctx;
  const topicLinks = topics.map((t) => `<li><a href="${link(depth, t.slug + '/')}">${esc(t.title)}</a></li>`).join('');
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-about">
        <p class="footer-lead">Run by students, for students.</p>
        <p>MESH isn't an official Islamic University website. Always confirm dates and requirements with the university or the right government office.</p>
      </div>
      <nav aria-label="Topics"><ul class="footer-links">${topicLinks}</ul></nav>
      <nav aria-label="MESH"><ul class="footer-links">
        <li><a href="${link(depth, 'ask/')}">Ask a question</a></li>
        <li><a href="${link(depth, 'ask/')}?type=tip">Share a tip</a></li>
        <li><a href="${link(depth, 'ask/')}?type=fix">Report a mistake</a></li>
        <li><a href="${link(depth, 'about/')}">About MESH</a></li>
      </ul></nav>
    </div>
  </div>
  <div class="footer-word" aria-hidden="true"><span>M</span><span>E</span><span>S</span><span>H</span></div>
</footer>`;
}

function dialogs(ctx, depth) {
  const { link, topics } = ctx;
  const items = topics.map((t) => `<li><a href="${link(depth, t.slug + '/')}"><span class="mi-en">${esc(t.title)}</span>${ar(t.arabic, 'mi-ar')}</a></li>`).join('');
  return `<dialog class="sheet menu-sheet" id="menu" aria-label="Menu">
  <div class="sheet-inner wrap">
    <div class="sheet-top"><a class="brand" href="${link(depth, '')}">MESH</a><button type="button" class="icon-btn" data-close aria-label="Close menu">${icon.close}</button></div>
    <ul class="menu-list">${items}</ul>
    <div class="menu-actions">
      <a class="btn btn-gold" href="${link(depth, 'ask/')}">Ask MESH</a>
      <a class="btn btn-ghost" href="${link(depth, 'about/')}">About MESH</a>
    </div>
  </div>
</dialog>
<dialog class="sheet search-sheet" id="search" aria-label="Search">
  <div class="sheet-inner wrap">
    <form class="search-bar" role="search" data-search-form>
      ${icon.search}
      <label class="sr-only" for="search-input">Search MESH</label>
      <input id="search-input" type="search" placeholder="Search visas, exams, food…" autocomplete="off" enterkeyhint="search">
      <button type="button" class="icon-btn" data-close aria-label="Close search">${icon.close}</button>
    </form>
    <div class="search-results" data-search-results aria-live="polite"></div>
  </div>
</dialog>`;
}

function shell(ctx, { title, description, depth, key, body, bodyClass = '', current = '' }) {
  return `${head(ctx, { title, description, depth, ogPath: key })}
<body class="${bodyClass}">
${ctx.PREVIEW ? '<p class="preview-flag">Preview. Items marked Example only show here.</p>' : ''}
${header(ctx, depth, current)}
<main id="main">
${body}
</main>
${footer(ctx, depth)}
${dialogs(ctx, depth)}
</body>
</html>
`;
}

const badge = (item) => item.example ? '<span class="badge">Example</span>' : item.draft ? '<span class="badge">Draft</span>' : '';

// ---------- shared blocks ----------

export function promptCard(label, text) {
  return `<figure class="prompt">
  <figcaption class="prompt-head"><span class="prompt-label">${esc(label)}</span><button type="button" class="copy-btn" data-copy>Copy prompt</button></figcaption>
  <pre><code>${esc(text)}</code></pre>
</figure>
`;
}

function postList(ctx, depth, list, { showTopic = false } = {}) {
  const { link, topicBySlug } = ctx;
  return `<ul class="post-list">${list.map((p) => `<li>
    <a class="post-row" href="${link(depth, `${p.topic}/${p.slug}/`)}">
      <span class="pr-title">${esc(p.title)}${badge(p)}</span>
      <span class="pr-summary">${esc(p.summary)}</span>
      <span class="pr-meta">${showTopic ? `${esc(topicBySlug[p.topic].title)}, updated` : 'Updated'} ${esc(fmtDate(p.updated))}</span>
    </a></li>`).join('')}</ul>`;
}

// Titles first; tap a title to see the description and the button to open it.
function foldList(ctx, depth, list) {
  const { link } = ctx;
  return `<ul class="fold-list">${list.map((p) => {
    const href = link(depth, `${p.topic}/${p.slug}/`);
    let extra = '';
    let action = `<a class="btn btn-gold btn-small" href="${href}">Read guide</a>`;
    if (p.type === 'prompt') {
      const m = (p._body || '').match(/```prompt[^\n]*\n([\s\S]*?)```/);
      const prompt = m ? m[1].trim() : '';
      if (prompt) extra = `<pre class="tool-peek" data-copy-source>${esc(prompt)}</pre>`;
      action = `${prompt ? '<button type="button" class="btn btn-gold btn-small" data-copy>Copy prompt</button>' : ''}<a class="btn btn-ghost btn-small" href="${href}">How to use it</a>`;
    }
    return `<li><details class="fold">
      <summary><span class="fold-title">${esc(p.title)}${badge(p)}</span><span class="fold-icon" aria-hidden="true"></span></summary>
      <div class="fold-body">
        <p class="pr-summary">${esc(p.summary)}</p>
        ${extra}
        <div class="btn-row">${action}</div>
        <p class="pr-meta">Updated ${esc(fmtDate(p.updated))}</p>
      </div>
    </details></li>`;
  }).join('')}</ul>`;
}

function fmtDate(iso) {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso + 'T00:00:00Z'));
}

function askBand(ctx, depth, topic) {
  const { link } = ctx;
  const q = topic ? `?topic=${topic.slug}` : '';
  return `<section class="band band-ask">
  <div class="band-lattice" aria-hidden="true"></div>
  <div class="wrap ask-inner">
    <h2>${topic ? `Still have a question about ${esc(lowerFirst(topic.title))}?` : 'Can’t find what you need?'}</h2>
    <p>Ask a question or share something you learned. It goes straight to the students who run MESH, and useful answers get added here.</p>
    <div class="btn-row">
      <a class="btn btn-gold" href="${link(depth, 'ask/')}${q}">Ask MESH</a>
      <a class="btn btn-ghost" href="${link(depth, 'ask/')}${q ? q + '&' : '?'}type=tip">Share a tip</a>
    </div>
  </div>
</section>`;
}

const lowerFirst = (s) => s.charAt(0).toLowerCase() + s.slice(1);

// ---------- home ----------

export function homePage(ctx) {
  const { site, topics, posts, events, link, TODAY } = ctx;
  const depth = 0;
  const letters = ['M', 'E', 'S', 'H'].map((l, i) => `<span class="wm-l" style="--i:${i}"><span>${l}</span></span>`).join('');

  const upcoming = events.filter((e) => (e.end || e.date) >= TODAY);
  const next = upcoming[0];
  const eventsJson = JSON.stringify(events.map((e) => ({ slug: e.slug, title: e.title, date: e.date, end: e.end, expected: e.expected, greg: e.greg, hijri: e.hijri })))
    .replace(/</g, '\\u003c');

  const nextUp = next ? `<section class="wrap next-up" aria-label="Next on the calendar">
  <a class="next-card" data-next-up href="${link(depth, 'calendar/#' + next.slug)}">
    <span class="next-line"><span data-next-title>${esc(next.title)}</span> <span class="next-when" data-next-when>soon</span></span>
    <span class="next-meta"><span data-next-meta>${next.expected ? 'Expected ' : ''}${esc(next.greg)}, ${esc(next.hijri)}</span> <span class="next-link">Full calendar ${icon.arrow}</span></span>
  </a>
  <script type="application/json" id="mesh-events">${eventsJson}</script>
</section>` : '';

  const rows = topics.map((t) => `<li>
      <a class="topic-row" href="${link(depth, t.slug + '/')}">
        <span class="tr-en" style="view-transition-name: t-${t.slug}">${esc(t.title)}</span>
        ${ar(t.arabic, 'tr-ar')}
        <span class="tr-blurb">${esc(t.blurb)}</span>
        <span class="tr-count">${esc(t.count)}</span>
        <span class="tr-arrow">${icon.arrow}</span>
      </a>
    </li>`).join('');

  const recent = posts.slice(0, 4);
  const recentSection = recent.length ? `<section class="wrap recent" aria-labelledby="recent-h">
  <h2 id="recent-h" class="section-title">Recently updated</h2>
  ${postList(ctx, depth, recent, { showTopic: true })}
</section>` : '';

  const body = `<section class="hero">
  <div class="hero-lattice" aria-hidden="true"><span class="lattice-glow"></span></div>
  <div class="wrap hero-inner">
    <p class="salam ar" lang="ar" dir="rtl">السلام عليكم ورحمة الله وبركاته</p>
    <h1 class="wordmark"><span class="sr-only">MESH, Medina English Student Hub</span><span class="wm-letters" aria-hidden="true">${letters}</span></h1>
    <span class="wm-rule" aria-hidden="true"></span>
    <p class="acronym" aria-hidden="true"><span><b>M</b>edina</span><i>·</i><span><b>E</b>nglish</span><i>·</i><span><b>S</b>tudent</span><i>·</i><span><b>H</b>ub</span></p>
    <div class="hero-foot">
      <p class="hero-lede">${esc(site.description)}</p>
      <button type="button" class="search-trigger" data-open-search>${icon.search}<span>Search visas, exams, food…</span><kbd>/</kbd></button>
      <p class="today" data-hijri-today>Today is ${esc(hijriText(TODAY))}, ${esc(new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(TODAY + 'T00:00:00Z')))}.</p>
    </div>
  </div>
</section>
${nextUp}
<section class="wrap topics" aria-labelledby="topics-h">
  <h2 id="topics-h" class="section-title">Find it by topic</h2>
  <ul class="topic-list">${rows}</ul>
</section>
${recentSection}
${askBand(ctx, depth)}`;

  return shell(ctx, { title: site.fullName, description: site.description, depth, key: '', body, bodyClass: 'page-home' });
}

function promptCards(ctx, depth, list) {
  const { link } = ctx;
  return list.map((p) => {
    const m = (p._body || '').match(/```prompt[^\n]*\n([\s\S]*?)```/);
    const prompt = m ? m[1].trim() : '';
    const href = link(depth, `${p.topic}/${p.slug}/`);
    return `<article class="tool-card">
      <h3><a href="${href}">${esc(p.title)}</a>${badge(p)}</h3>
      <p>${esc(p.summary)}</p>
      ${prompt ? `<pre class="tool-peek" data-copy-source>${esc(prompt)}</pre>
      <div class="btn-row"><button type="button" class="btn btn-gold btn-small" data-copy>Copy prompt</button><a class="btn btn-ghost btn-small" href="${href}">How to use it</a></div>` : ''}
    </article>`;
  }).join('');
}

// ---------- topic ----------

export function topicPage(ctx, t) {
  const { link, site } = ctx;
  const depth = 1;
  let widget = '';
  if (t.widget === 'calendar') widget = calendarWidget(ctx, depth);
  if (t.widget === 'restaurants') widget = restaurantWidget(ctx, depth);

  const prompts = t.posts.filter((p) => p.type === 'prompt');
  const guideList = t.posts.filter((p) => p.type !== 'prompt');
  const promptSection = prompts.length ? `<section class="wrap topic-prompts" aria-labelledby="prompts-h">
  <h2 id="prompts-h" class="section-title">AI prompts</h2>
  <p class="section-note">Copy a prompt, paste it into any AI chat (Claude, ChatGPT or Gemini), then add your notes.</p>
  ${foldList(ctx, depth, prompts)}
</section>` : '';
  const empty = t.widget || prompts.length ? '' : `<div class="empty">
      <p class="empty-title">No guides here yet.</p>
      <p>Guides for this topic are moving over from the Telegram group. Ask your question now and the answer will be added here.</p>
      <a class="btn btn-gold" href="${link(depth, 'ask/')}?topic=${t.slug}">Ask about ${esc(lowerFirst(t.title))}</a>
    </div>`;
  const guidesHeading = prompts.length && t.slug === 'study' ? 'Study tips' : (t.widget ? 'Guides' : 'All guides');
  const guides = guideList.length
    ? `<section class="wrap topic-posts" aria-labelledby="guides-h"><h2 id="guides-h" class="section-title">${guidesHeading}</h2>${foldList(ctx, depth, guideList)}</section>`
    : (empty ? `<section class="wrap topic-posts">${empty}</section>` : '');

  const body = `<section class="wrap topic-hero">
  <a class="crumb" href="${link(depth, '')}#topics-h">${icon.back}All topics</a>
  ${ar(t.arabic, 'topic-ar')}
  <h1 class="topic-title" style="view-transition-name: t-${t.slug}">${esc(t.title)}</h1>
  <div class="topic-intro prose">${t.introHtml}</div>
</section>
${widget}
${guides}
${promptSection}
${askBand(ctx, depth, t)}`;
  return shell(ctx, { title: `${t.title} | ${site.name}`, description: t.blurb, depth, key: `${t.slug}/`, body, bodyClass: `page-topic topic-${t.slug}`, current: `${t.slug}/` });
}

function calendarWidget(ctx, depth) {
  const { events, TODAY } = ctx;
  if (!events.length) return `<section class="wrap"><div class="empty"><p class="empty-title">No dates yet.</p><p>Term dates and holidays will appear here with countdowns.</p></div></section>`;
  const kinds = [...new Set(events.map((e) => e.kind))];
  const chips = kinds.length > 1 ? `<div class="chips" role="group" aria-label="Show">
      <button type="button" class="chip" aria-pressed="true" data-filter="all">All</button>
      ${kinds.map((k) => `<button type="button" class="chip" aria-pressed="false" data-filter="${k}">${esc(events.find((e) => e.kind === k).kindLabel)}</button>`).join('')}
    </div>` : '';
  const item = (e) => `<li class="cal-item" id="${e.slug}" data-date="${e.date}" data-end="${e.end}" data-kind="${e.kind}">
      <div class="cal-when" aria-hidden="true"><span class="cal-day">${esc(e.day)}</span><span class="cal-mon">${esc(e.mon)}</span><span class="cal-wk">${esc(e.wk)}</span></div>
      <div class="cal-what">
        <h3>${esc(e.title)}${badge(e)}</h3>
        ${ar(e.arabic, 'cal-ar')}
        <p class="cal-dates"><span class="sr-only">${esc(e.greg)}. </span>${esc(e.hijri)}${e.end ? ` to ${esc(e.hijriEnd)}` : ''}${e.end ? `<br>${esc(e.greg)} to ${esc(e.gregEnd)}` : ''}</p>
        ${e.expected ? '<p class="cal-note">Expected date. Confirmed by moon sighting.</p>' : ''}
        ${e.noteHtml ? `<div class="cal-body prose">${e.noteHtml}</div>` : ''}
      </div>
      <p class="cal-count"><span class="kind kind-${e.kind}">${esc(e.kindLabel)}</span><span data-countdown>${(e.end || e.date) < TODAY ? 'Passed' : ''}</span></p>
    </li>`;
  return `<section class="wrap cal" data-calendar aria-label="Dates">
  ${chips}
  <ol class="cal-list" data-cal-upcoming>${events.filter((e) => (e.end || e.date) >= TODAY).map(item).join('')}</ol>
  <details class="cal-past" data-cal-past-wrap><summary>Past dates</summary><ol class="cal-list" data-cal-past>${events.filter((e) => (e.end || e.date) < TODAY).map(item).join('')}</ol></details>
</section>`;
}

function restaurantWidget(ctx, depth) {
  const { restaurants, site } = ctx;
  const landmarks = site.landmarks || [];
  const all = [...restaurants, ...landmarks];
  if (!restaurants.length) {
    return `<section class="wrap"><div class="empty"><p class="empty-title">No places yet.</p><p>The first recommendations are coming over from the Telegram group. Know somewhere good? Suggest it and it'll go on the map.</p><a class="btn btn-gold" href="${ctx.link(depth, 'ask/')}?type=restaurant&topic=restaurants">Suggest a place</a></div></section>`;
  }
  // Equirectangular projection, scaled for latitude, fitted to the points.
  const lats = all.map((p) => p.lat);
  const lngs = all.map((p) => p.lng);
  const k = Math.cos((24.47 * Math.PI) / 180);
  let minX = Math.min(...lngs) * k, maxX = Math.max(...lngs) * k;
  let minY = -Math.max(...lats), maxY = -Math.min(...lats);
  const spanX = Math.max(maxX - minX, 0.01), spanY = Math.max(maxY - minY, 0.01);
  const padX = spanX * 0.14 + 0.004, padY = spanY * 0.22 + 0.004;
  minX -= padX; maxX += padX; minY -= padY; maxY += padY;
  const W = 700;
  const H = Math.round(Math.min(Math.max((W * (maxY - minY)) / (maxX - minX), 470), 640));
  // Keep aspect: recentre the shorter axis.
  const scale = Math.min(W / (maxX - minX), H / (maxY - minY));
  const offX = (W - (maxX - minX) * scale) / 2, offY = (H - (maxY - minY) * scale) / 2;
  const px = (p) => [offX + (p.lng * k - minX) * scale, offY + (-p.lat - minY) * scale].map((v) => Math.round(v * 10) / 10);

  const lm = landmarks.map((l) => {
    const [x, y] = px(l);
    const left = x > W * 0.62;
    return `<g class="map-landmark" transform="translate(${x} ${y})"><rect x="-8" y="-8" width="16" height="16" transform="rotate(45)"/><text x="${left ? -18 : 18}" y="7" text-anchor="${left ? 'end' : 'start'}">${esc(l.name)}</text></g>`;
  }).join('');
  const pins = restaurants.map((r) => {
    const [x, y] = px(r);
    return `<a class="map-pin" href="#${r.slug}" aria-label="${esc(r.name)}"><g transform="translate(${x} ${y})"><circle r="20" class="pin-halo"/><circle r="10" class="pin-dot"/></g></a>`;
  }).join('');
  const svg = `<svg class="map-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Map of restaurant locations relative to Masjid an-Nabawi and the Islamic University">
    <defs>${latticeDefs('map-lattice', 36)}</defs>
    <rect width="${W}" height="${H}" class="map-bg"/>
    <rect width="${W}" height="${H}" fill="url(#map-lattice)"/>
    ${lm}${pins}
  </svg>`;

  const cards = restaurants.map((r) => {
    const dist = landmarks.map((l) => `${km(r, l)} km from ${esc(l.short || l.name)}`).join('<br>');
    const maps = r.maps || `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`;
    return `<li class="food-card" id="${r.slug}">
      <div class="fc-head"><h3>${esc(r.name)}${badge(r)}</h3>${ar(r.arabic, 'fc-ar')}</div>
      <p class="fc-meta">${[r.cuisine, r.area, r.price].filter(Boolean).map(esc).join(', ')}</p>
      ${r.noteHtml ? `<div class="prose fc-note">${r.noteHtml}</div>` : ''}
      ${r.tags.length ? `<ul class="tags">${r.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <div class="fc-foot"><p class="fc-dist">${dist}</p><a class="btn btn-small btn-ghost" href="${esc(maps)}" target="_blank" rel="noopener">${icon.pin}Directions</a></div>
    </li>`;
  }).join('');

  return `<section class="wrap food" aria-label="Restaurants">
  <figure class="food-map">${svg}<figcaption>Pins are placed by GPS position. Tap one to jump to it.</figcaption></figure>
  <ul class="food-list">${cards}</ul>
</section>`;
}

function km(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return (2 * R * Math.asin(Math.sqrt(h))).toFixed(1);
}

// ---------- post ----------

export function postPage(ctx, t, p) {
  const { link, site } = ctx;
  const depth = 2;
  const more = t.posts.filter((x) => x !== p).slice(0, 3);
  const body = `<article class="wrap post">
  <header class="post-head">
    <a class="crumb" href="${link(depth, t.slug + '/')}">${icon.back}${esc(t.title)}</a>
    <h1 class="post-title">${esc(p.title)}${badge(p)}</h1>
    <p class="post-summary">${esc(p.summary)}</p>
    <p class="post-meta">Updated <time datetime="${p.updated}">${esc(fmtDate(p.updated))}</time>${p.source ? `. ${esc(p.source)}` : ''}</p>
  </header>
  <div class="prose post-body">${p.html}</div>
  <p class="post-fix">Something out of date? <a href="${link(depth, 'ask/')}?type=fix&topic=${t.slug}&page=${encodeURIComponent(t.slug + '/' + p.slug + '/')}">Tell us and we’ll fix it</a>.</p>
</article>
${more.length ? `<section class="wrap more" aria-labelledby="more-h"><h2 id="more-h" class="section-title">More in ${esc(lowerFirst(t.title))}</h2>${postList(ctx, depth, more)}</section>` : ''}
${askBand(ctx, depth, t)}`;
  return shell(ctx, { title: `${p.title} | ${site.name}`, description: p.summary, depth, key: `${t.slug}/${p.slug}/`, body, bodyClass: 'page-post' });
}

// ---------- ask ----------

export function askPage(ctx) {
  const { site, topics, PREVIEW } = ctx;
  const depth = 1;
  const key = site.formAccessKey || '';
  const notice = !key ? `<p class="notice">${PREVIEW ? 'Preview: this form shows how sending works but doesn’t send anything.' : 'This form isn’t connected yet. Messages can’t be sent until the Web3Forms key is added to site.json.'}</p>` : '';
  const types = [['question', 'A question'], ['tip', 'A tip'], ['restaurant', 'A restaurant'], ['fix', 'A correction']];
  const body = `<section class="wrap ask">
  <div class="ask-head">
    <h1 class="page-title">Ask MESH</h1>
    <p class="lede">Questions, tips, restaurant suggestions and corrections all go to the same inbox. Useful answers get added to the site for everyone.</p>
  </div>
  <form class="ask-form" id="ask-form" novalidate data-access-key="${esc(key)}" data-preview="${PREVIEW ? '1' : ''}">
    ${notice}
    <fieldset class="field">
      <legend>What are you sending?</legend>
      <div class="chips">${types.map(([v, l], i) => `<label class="chip-radio"><input type="radio" name="type" value="${v}" id="type-${v}"${i === 0 ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>
    </fieldset>
    <div class="field">
      <label for="ask-topic">Topic</label>
      <select id="ask-topic" name="topic">
        ${topics.map((t) => `<option value="${t.slug}">${esc(t.title)}</option>`).join('')}
        <option value="other">Something else</option>
      </select>
    </div>
    <div class="field">
      <label for="ask-message">Your message</label>
      <textarea id="ask-message" name="message" rows="6" required minlength="10" placeholder="Be as specific as you can. If it's about a place, say where it is."></textarea>
      <p class="field-error" id="ask-message-error" hidden>Write at least a sentence so we know what you mean.</p>
    </div>
    <div class="field-row">
      <div class="field">
        <label for="ask-name">Name <span class="optional">optional</span></label>
        <input id="ask-name" name="name" type="text" autocomplete="name">
      </div>
      <div class="field">
        <label for="ask-email">Email for a reply <span class="optional">optional</span></label>
        <input id="ask-email" name="email" type="email" autocomplete="email" inputmode="email">
        <p class="field-error" id="ask-email-error" hidden>That email doesn't look right. Check it or leave it empty.</p>
      </div>
    </div>
    <input type="hidden" name="page" id="ask-page" value="">
    <label class="hp" aria-hidden="true">Leave this empty <input type="checkbox" name="botcheck" tabindex="-1" autocomplete="off"></label>
    <div class="form-foot">
      <button type="submit" class="btn btn-gold">Send to MESH</button>
      <p class="form-hint">Please don't send passport or iqama numbers.</p>
    </div>
    <div class="form-status" role="status" aria-live="polite" hidden></div>
  </form>
</section>`;
  return shell(ctx, { title: `Ask | ${site.name}`, description: 'Send MESH a question, a tip, a restaurant or a correction.', depth, key: 'ask/', body, bodyClass: 'page-ask', current: 'ask/' });
}

// ---------- about ----------

export function aboutPage(ctx) {
  const { site, link } = ctx;
  const depth = 1;
  const body = `<section class="wrap about">
  <h1 class="page-title">About MESH</h1>
  <div class="prose about-body">
    <p class="lede">MESH stands for Medina English Student Hub. It's a resource hub for English-speaking students in Madinah, especially at the Islamic University, and for their families.</p>
    <p>It started as a Telegram group. Most people here don't use Telegram, so everything moved to this site, sorted by topic so you can find it without scrolling through old messages.</p>
    <h2>Who runs it</h2>
    <p>A small team of students, in their spare time. Nothing here is official. Rules and dates change, so always confirm anything important with the university or the right government office, and check when a guide was last updated.</p>
    <h2>How to help</h2>
    <p>If you know something useful, a good place to eat, or spot a mistake, <a href="${link(depth, 'ask/')}?type=tip">send it in</a>. Every message is read.</p>
    <p class="dua ar" lang="ar" dir="rtl">جزاكم الله خيرا</p>
  </div>
</section>`;
  return shell(ctx, { title: `About | ${site.name}`, description: 'What MESH is and who runs it.', depth, key: 'about/', body, bodyClass: 'page-about', current: 'about/' });
}

// ---------- 404 ----------

export function notFoundPage(ctx) {
  const { site, PREVIEW } = ctx;
  // The 404 page can be served from any path, so on the live site it links from the domain root.
  const local = { ...ctx, link: (d, k) => (PREVIEW ? ctx.link(0, k) : '/' + k) };
  const body = `<section class="wrap lost">
  <p class="lost-code" aria-hidden="true">404</p>
  <h1 class="page-title">This page isn't here.</h1>
  <p class="lede">It may have moved when MESH was reorganised. Try searching, or start from the topics.</p>
  <div class="btn-row"><button type="button" class="btn btn-gold" data-open-search>Search MESH</button><a class="btn btn-ghost" href="${local.link(0, '')}">Go to the home page</a></div>
</section>`;
  const html = shell(local, { title: `Page not found | ${site.name}`, description: site.description, depth: 0, key: '404', body, bodyClass: 'page-404' });
  return PREVIEW ? html : html.replace('content="./"', 'content="/"').replace(/(href|src)="\.\/assets\//g, '$1="/assets/');
}
