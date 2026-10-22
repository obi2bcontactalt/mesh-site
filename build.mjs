#!/usr/bin/env node
// MESH site builder. No packages to install: it only needs Node 20+.
//
//   node build.mjs            → builds the live site into dist/
//   node build.mjs --preview  → builds dist-preview/ (shows example + draft
//                               content, links point straight at index.html
//                               files so the site opens without a server)
//
// Content lives in content/ as Markdown files. See CLAUDE.md for the rules.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { marked } from './tools/vendor/marked.esm.js';
import { parseFrontmatter } from './tools/lib/frontmatter.mjs';
import { hijri, gregorian, isIsoDate, todayInMadinah } from './tools/lib/dates.mjs';
import * as T from './tools/templates.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW = process.argv.includes('--preview');
const OUT = path.join(ROOT, PREVIEW ? 'dist-preview' : 'dist');
const TODAY = todayInMadinah();

const problems = [];
const problem = (msg) => problems.push(msg);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ---------- load ----------

const site = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.json'), 'utf8'));
// Local words explained on tap in guides (content/glossary.json). Meanings come from the guides themselves.
const glossary = fs.existsSync(path.join(ROOT, 'content/glossary.json'))
  ? JSON.parse(fs.readFileSync(path.join(ROOT, 'content/glossary.json'), 'utf8')) : [];

function readMarkdownDir(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort()
    .map((f) => {
      const rel = path.join(dir, f);
      const slug = f.replace(/\.md$/, '');
      if (!SLUG.test(slug)) problem(`${rel}: file names use lowercase letters, numbers and hyphens only (e.g. "iqama-renewal.md").`);
      try {
        const { data, body } = parseFrontmatter(fs.readFileSync(path.join(abs, f), 'utf8'), rel);
        return { file: rel, slug, data, body };
      } catch (e) {
        problem(e.message);
        return null;
      }
    })
    .filter(Boolean);
}

function need(item, keys) {
  for (const k of keys) {
    if (item.data[k] === undefined || item.data[k] === '') problem(`${item.file}: missing "${k}" in the front matter.`);
  }
}

function visible(item) {
  if (item.data.example && !PREVIEW) return false;
  if (item.data.draft && !PREVIEW) return false;
  return true;
}

// Topics
const topics = readMarkdownDir('content/topics').map((t) => {
  need(t, ['title', 'arabic', 'order', 'blurb']);
  return {
    slug: t.slug,
    title: t.data.title,
    arabic: t.data.arabic,
    order: Number(t.data.order) || 99,
    blurb: t.data.blurb,
    widget: t.data.widget || '',
    introHtml: '',
    _body: t.body,
    file: t.file,
  };
}).sort((a, b) => a.order - b.order);
const topicBySlug = Object.fromEntries(topics.map((t) => [t.slug, t]));

// Posts: content/posts/<topic>/<slug>.md
const posts = [];
for (const t of topics) {
  for (const p of readMarkdownDir(`content/posts/${t.slug}`)) {
    need(p, ['title', 'summary', 'updated']);
    if (p.data.updated && !isIsoDate(p.data.updated)) problem(`${p.file}: "updated" must be a date like 2026-10-21.`);
    if (p.data.type && !['guide', 'prompt', 'links'].includes(p.data.type)) problem(`${p.file}: "type" must be guide, prompt or links.`);
    if (!visible(p)) continue;
    posts.push({
      slug: p.slug,
      topic: t.slug,
      title: p.data.title,
      summary: p.data.summary,
      updated: p.data.updated,
      source: p.data.source || '',
      tags: Array.isArray(p.data.tags) ? p.data.tags : [],
      type: ['prompt', 'links'].includes(p.data.type) ? p.data.type : 'guide',
      order: typeof p.data.order === 'number' ? p.data.order : 999,
      example: !!p.data.example,
      draft: !!p.data.draft,
      checklist: !!p.data.checklist,
      _body: p.body,
      file: p.file,
    });
  }
}
// Catch posts filed under a folder that isn't a topic.
const postsRoot = path.join(ROOT, 'content/posts');
if (fs.existsSync(postsRoot)) {
  for (const d of fs.readdirSync(postsRoot)) {
    if (fs.statSync(path.join(postsRoot, d)).isDirectory() && !topicBySlug[d]) {
      problem(`content/posts/${d}/: there is no topic called "${d}". Use one of: ${topics.map((t) => t.slug).join(', ')}.`);
    }
  }
}
posts.sort((a, b) => (b.updated || '').localeCompare(a.updated || '') || a.title.localeCompare(b.title));
// Lists inside a topic follow `order` when a post sets it (e.g. the mind map maker before the exam maker).
const topicOrder = (list) => [...list].sort((a, b) => a.order - b.order);

// Calendar
const KINDS = { islamic: 'Islamic dates', national: 'Saudi', university: 'University', other: 'Other' };
const events = readMarkdownDir('content/calendar').map((e) => {
  need(e, ['title', 'date']);
  if (e.data.date && !isIsoDate(e.data.date)) problem(`${e.file}: "date" must look like 2027-02-08.`);
  if (e.data.end && !isIsoDate(e.data.end)) problem(`${e.file}: "end" must look like 2027-02-08.`);
  const kind = e.data.kind || 'other';
  if (!KINDS[kind]) problem(`${e.file}: "kind" must be one of ${Object.keys(KINDS).join(', ')}.`);
  if (!visible(e)) return null;
  if ((e.data.end || e.data.date) < TODAY) return null; // passed dates are never shown
  return {
    slug: e.slug,
    title: e.data.title,
    arabic: e.data.arabic || '',
    term: e.data.term || '',
    date: e.data.date,
    end: e.data.end || '',
    kind,
    kindLabel: KINDS[kind] || 'Other',
    expected: !!e.data.expected,
    example: !!e.data.example,
    noteHtml: '',
    _body: e.body,
    file: e.file,
  };
}).filter(Boolean).sort((a, b) => a.date.localeCompare(b.date));

// Restaurants
const PRICES = { budget: 'Budget', mid: 'Mid-range', treat: 'Treat' };
const restaurants = readMarkdownDir('content/restaurants').map((r) => {
  need(r, ['name', 'area', 'lat', 'lng']);
  if (typeof r.data.lat !== 'number' || typeof r.data.lng !== 'number') problem(`${r.file}: "lat" and "lng" must be numbers like 24.4672.`);
  if (r.data.price && !PRICES[r.data.price]) problem(`${r.file}: "price" must be one of ${Object.keys(PRICES).join(', ')}.`);
  if (!visible(r)) return null;
  return {
    slug: r.slug,
    name: r.data.name,
    arabic: r.data.arabic || '',
    area: r.data.area,
    cuisine: r.data.cuisine || '',
    price: PRICES[r.data.price] || '',
    tags: Array.isArray(r.data.tags) ? r.data.tags : [],
    lat: r.data.lat,
    lng: r.data.lng,
    maps: r.data.maps || '',
    example: !!r.data.example,
    noteHtml: '',
    _body: r.body,
    file: r.file,
  };
}).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));

if (problems.length) {
  console.error('\nThe site was not built. Fix these first:\n');
  for (const p of problems) console.error('  • ' + p);
  console.error('');
  process.exit(1);
}

// ---------- links ----------

// Every link is relative, so the site works on any host and from a folder.
// `key` is a site path without the leading slash: '' (home), 'study/', 'study/some-post/', 'assets/site.css'.
function rootFor(depth) {
  return depth === 0 ? './' : '../'.repeat(depth);
}
function link(depth, key) {
  const [p, hash] = key.split('#');
  let out = rootFor(depth) + p;
  if (PREVIEW && (p === '' || p.endsWith('/'))) out += 'index.html';
  return hash !== undefined ? `${out}#${hash}` : out;
}
const depthOf = (key) => key.split('/').filter(Boolean).length;

// ---------- markdown ----------

const esc = T.esc;
const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'section';

marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      const [kind, ...rest] = (lang || '').trim().split(/\s+/);
      if (kind === 'prompt') {
        const label = rest.join(' ') || 'Prompt';
        return T.promptCard(label, text);
      }
      return `<div class="code-block"><pre><code>${esc(text)}</code></pre><button type="button" class="copy-btn" data-copy>Copy</button></div>\n`;
    },
    heading({ tokens, depth }) {
      const inner = this.parser.parseInline(tokens);
      const level = Math.min(Math.max(depth, 2), 4);
      const id = slugify(inner.replace(/<[^>]+>/g, ''));
      return `<h${level} id="${id}">${inner}</h${level}>\n`;
    },
    link({ href, title, tokens }) {
      const inner = this.parser.parseInline(tokens);
      const t = title ? ` title="${esc(title)}"` : '';
      if (/^https?:\/\//i.test(href)) return `<a href="${esc(href)}"${t} target="_blank" rel="noopener">${inner}</a>`;
      return `<a href="${esc(href)}"${t}>${inner}</a>`;
    },
  },
});

const ALERTS = { NOTE: 'Note', TIP: 'Tip', IMPORTANT: 'Important', WARNING: 'Check first' };

function md(src, depth) {
  let html = marked.parse(src || '');
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<blockquote>\s*<p>\[!(NOTE|TIP|IMPORTANT|WARNING)\]\s*/g, (_, k) =>
    `<blockquote class="callout callout-${k.toLowerCase()}"><p class="callout-title">${ALERTS[k]}</p><p>`);
  html = html.replace(/<p>\s*<\/p>/g, '');
  // Root links written as "/visas/" or "/assets/img/x.jpg" become relative.
  html = html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (_, attr, p) => `${attr}="${link(depth, p)}"`);
  return html;
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: ' ' };
// Guides: each ## heading gets a coloured bar, and what follows it sits in an offset block.
function sectionise(html) {
  const parts = html.split(/(?=<h2 )/);
  return parts.map((part) => {
    const m = part.match(/^(<h2 [^>]*>[\s\S]*?<\/h2>)\s*([\s\S]*)$/);
    return m ? `${m[1]}\n<div class="sec-body">${m[2]}</div>\n` : part;
  }).join('');
}

const plain = (html) => html.replace(/<[^>]+>/g, ' ')
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITIES[e]).replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();

// Wrap the first mention of each glossary word in a guide in a tap-to-explain button.
// Skips headings, links, code, prompt cards and buttons.
function explainTerms(html) {
  const used = [];
  const left = glossary.map((g, i) => ({ i, g, re: new RegExp(`(^|[^\\w'])(${(g.match || [g.term]).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w'])`, 'i') }));
  const SKIP = /^(a|h1|h2|h3|h4|code|pre|button|summary|figcaption)$/;
  const stack = [];
  let skipDepth = 0;
  const out = html.split(/(<[^>]+>)/).map((tok) => {
    const tag = tok.match(/^<(\/?)([a-z0-9]+)/i);
    if (tag) {
      const name = tag[2].toLowerCase();
      const closing = tag[1] === '/';
      const isSkip = SKIP.test(name) || (name === 'div' && /class="[^"]*prompt/.test(tok));
      if (!closing && !/\/>$/.test(tok) && !/^(br|img|hr|input|meta|link|source|col|wbr)$/.test(name)) {
        stack.push(isSkip); if (isSkip) skipDepth++;
      } else if (closing) {
        const was = stack.pop(); if (was) skipDepth--;
      }
      return tok;
    }
    if (skipDepth > 0 || !tok.trim()) return tok;
    for (const item of left) {
      if (item.done) continue;
      const m = tok.match(item.re);
      if (!m) continue;
      item.done = true;
      used.push(item.g);
      const at = m.index + m[1].length;
      tok = tok.slice(0, at) + `<button type="button" class="term" data-term="${item.i}">${m[2]}</button>` + tok.slice(at + m[2].length);
    }
    return tok;
  }).join('');
  return [out, used.map((g) => ({ ...g, i: glossary.indexOf(g) }))];
}

// ---------- derived data ----------

for (const t of topics) t.introHtml = md(t._body, 1);
for (const e of events) {
  e.noteHtml = md(e._body, 1);
  e.hijri = hijri(e.date).text;
  e.hijriEnd = e.end ? hijri(e.end).text : '';
  e.greg = gregorian(e.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  e.gregEnd = e.end ? gregorian(e.end, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';
  e.day = gregorian(e.date, { day: 'numeric' });
  e.mon = gregorian(e.date, { month: 'short', year: 'numeric' });
  e.wk = gregorian(e.date, { weekday: 'short' });
  e.open = !!e.end && e.date < TODAY; // a window that has opened but not closed yet
  if (e.end) {
    e.endDay = gregorian(e.end, { day: 'numeric' });
    e.endMon = gregorian(e.end, { month: 'short', year: 'numeric' });
    e.endWk = gregorian(e.end, { weekday: 'short' });
  }
}
// Show dates in the order they matter: open windows by their closing date, the rest by their start.
events.sort((a, b) => (a.open ? a.end : a.date).localeCompare(b.open ? b.end : b.date));
for (const r of restaurants) r.noteHtml = md(r._body, 1);

for (const t of topics) {
  t.posts = topicOrder(posts.filter((p) => p.topic === t.slug));
  if (t.widget === 'calendar') {
    const upcoming = events.filter((e) => (e.end || e.date) >= TODAY).length;
    t.count = upcoming ? `${upcoming} upcoming date${upcoming === 1 ? '' : 's'}` : '';
  } else if (t.widget === 'restaurants') {
    t.count = restaurants.length ? `${restaurants.length} place${restaurants.length === 1 ? '' : 's'}` : '';
  } else {
    const g = t.posts.filter((p) => p.type !== 'prompt').length;
    const pr = t.posts.length - g;
    t.count = [pr ? `${pr} AI prompt${pr === 1 ? '' : 's'}` : '', g ? `${g} guide${g === 1 ? '' : 's'}` : ''].filter(Boolean).join(', ');
  }
  if (!t.count) t.count = 'Coming soon';
}

// Check that the shortcuts in site.json and glossary links point at real pages.
{
  const pages = new Set(['calendar/', ...topics.map((t) => t.slug + '/'), ...posts.map((p) => `${p.topic}/${p.slug}/`)]);
  const check = (where, page) => { if (page && !pages.has(page.split('#')[0])) problem(`${where}: "${page}" isn't a page on the site.`); };
  for (const q of site.popular || []) check('site.json popular', q.page);
  for (const r of site.roles || []) {
    check(`site.json roles (${r.label})`, r.start);
    for (const t of r.topics || []) if (!topicBySlug[t]) problem(`site.json roles (${r.label}): no topic called "${t}".`);
    if (!r.startLabel) { const p = posts.find((x) => `${x.topic}/${x.slug}/` === r.start); r.startLabel = p ? p.title : ''; }
  }
  for (const g of glossary) { if (!g.term || !g.meaning) problem('content/glossary.json: every entry needs "term" and "meaning".'); check(`content/glossary.json (${g.term})`, g.link); }
}
if (problems.length) {
  console.error('\nThe site was not built. Fix these first:\n');
  for (const p of problems) console.error('  • ' + p);
  console.error('');
  process.exit(1);
}

const ctx = { site, glossary, topics, topicBySlug, posts, events, restaurants, link, depthOf, md, PREVIEW, TODAY, assetVersion: '' };

// ---------- write ----------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// assets
copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
const hash = crypto.createHash('sha1');
for (const f of ['site.css', 'site.js']) hash.update(fs.readFileSync(path.join(ROOT, 'assets', f)));
ctx.assetVersion = hash.digest('hex').slice(0, 8);

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f);
    const b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

const written = [];
function page(key, html) {
  const file = key === '404' ? path.join(OUT, '404.html') : path.join(OUT, key, 'index.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  if (key !== '404') written.push(key);
}

page('', T.homePage(ctx));
for (const t of topics) {
  page(`${t.slug}/`, T.topicPage(ctx, t));
  for (const p of t.posts) {
    p.html = sectionise(md(p._body, 2));
    p.toc = [...p.html.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map((m) => ({ id: m[1], text: plain(m[2]).replace(/^\d+\.\s*/, '') }));
    p.numbered = /<h2 id="[^"]+">\s*1\./.test(p.html);
    p.minutes = Math.max(1, Math.round(plain(p.html).split(' ').length / 200));
    if (p.type !== 'prompt') [p.html, p.terms] = explainTerms(p.html);
    page(`${t.slug}/${p.slug}/`, T.postPage(ctx, t, p));
  }
}
page('ask/', T.askPage(ctx));
page('about/', T.aboutPage(ctx));
page('404', T.notFoundPage(ctx));

// search index
const index = [];
for (const t of topics) index.push({ u: `${t.slug}/`, t: t.title, c: 'Topic', s: t.blurb, a: t.arabic, x: plain(t.introHtml) });
for (const p of posts) index.push({ u: `${p.topic}/${p.slug}/`, t: p.title, c: topicBySlug[p.topic].title, s: p.summary, a: '', x: plain(p.html || md(p._body, 2)).slice(0, 4000), g: p.tags.join(' ') });
for (const e of events) index.push({ u: `calendar/#${e.slug}`, t: e.title, c: 'Calendar', s: `${e.greg}, ${e.hijri}`, a: e.arabic, x: plain(e.noteHtml) });
for (const r of restaurants) index.push({ u: `restaurants/#${r.slug}`, t: r.name, c: 'Restaurants', s: [r.cuisine, r.area].filter(Boolean).join(', '), a: r.arabic, x: plain(r.noteHtml) + ' ' + r.tags.join(' ') });
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(index));

// calendar files: one .ics per date (tap to add it to the phone's calendar) and one with every date
{
  const base = (site.url || '').replace(/\/$/, '');
  const esc = (t) => String(t).replace(/\\/g, '\\\\').replace(/[,;]/g, (c) => '\\' + c).replace(/\n/g, '\\n');
  const ymd = (iso) => iso.replace(/-/g, '');
  const nextDay = (iso) => new Date(Date.parse(iso + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  // fold long lines at 74 bytes as the format asks
  const fold = (line) => {
    const out = []; let cur = '';
    for (const ch of line) {
      if (Buffer.byteLength(cur + ch) > (out.length ? 73 : 74)) { out.push(cur); cur = ''; }
      cur += ch;
    }
    out.push(cur);
    return out.join('\r\n ');
  };
  const vevent = (e) => {
    const desc = [e.arabic, e.hijri + (e.end ? ` to ${e.hijriEnd}` : ''), e.expected ? 'Expected date: confirmed by moon sighting.' : (e.term ? `${e.term}, from the Islamic University academic calendar.` : ''), plain(e.noteHtml), base ? `${base}/calendar/#${e.slug}` : ''].filter(Boolean).join('\n');
    return ['BEGIN:VEVENT', `UID:${e.slug}@mesh`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(e.date)}`, `DTEND;VALUE=DATE:${ymd(nextDay(e.end || e.date))}`,
      `SUMMARY:${esc(e.title)}`, `DESCRIPTION:${esc(desc)}`, base ? `URL:${base}/calendar/#${e.slug}` : '', 'TRANSP:TRANSPARENT',
      // reminder at 9:00 the day before
      'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:Tomorrow: ${esc(e.title)}`, 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT'].filter(Boolean);
  };
  const cal = (list, name) => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MESH//Medina English Student Hub//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`, ...list.flatMap(vevent), 'END:VCALENDAR'].map(fold).join('\r\n') + '\r\n';
  const dir = path.join(OUT, 'calendar');
  fs.mkdirSync(dir, { recursive: true });
  for (const e of events) fs.writeFileSync(path.join(dir, `${e.slug}.ics`), cal([e], 'MESH'));
  fs.writeFileSync(path.join(dir, 'mesh-calendar.ics'), cal(events, 'MESH: university and Islamic dates'));
}

// live-site extras
if (!PREVIEW) {
  // Installable app + offline reading: a manifest and a service worker.
  fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
    name: `${site.name}: ${site.fullName || 'Medina English Student Hub'}`,
    short_name: site.name,
    description: site.description,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#F1EBDD',
    theme_color: '#0F5A3B',
    icons: [
      { src: '/assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2));
  const pages = written.map((k) => '/' + k);
  const swVersion = crypto.createHash('sha1').update(ctx.assetVersion + pages.map((k) => fs.readFileSync(path.join(OUT, k, 'index.html'))).join('')).digest('hex').slice(0, 10);
  fs.writeFileSync(path.join(OUT, 'sw.js'), fs.readFileSync(path.join(ROOT, 'tools/sw.js'), 'utf8')
    .replace('__VERSION__', swVersion)
    .replace('__PRECACHE__', JSON.stringify([...pages, `/assets/site.css?v=${ctx.assetVersion}`, `/assets/site.js?v=${ctx.assetVersion}`, '/search-index.json', '/assets/img/icon-192.png', '/assets/img/favicon.svg'])));
  const base = (site.url || '').replace(/\/$/, '');
  if (base) {
    const urls = written.map((k) => `  <url><loc>${base}/${k}</loc></url>`).join('\n');
    fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
  }
}

const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
console.log(`Built ${n(written.length, 'page', 'pages')} into ${path.relative(ROOT, OUT)}/ (${n(posts.length, 'guide', 'guides')}, ${n(events.length, 'date', 'dates')}, ${n(restaurants.length, 'place', 'places')}${PREVIEW ? ', preview mode' : ''}).`);
