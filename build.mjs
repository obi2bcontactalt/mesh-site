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
    if (p.data.type && !['guide', 'prompt'].includes(p.data.type)) problem(`${p.file}: "type" must be guide or prompt.`);
    if (!visible(p)) continue;
    posts.push({
      slug: p.slug,
      topic: t.slug,
      title: p.data.title,
      summary: p.data.summary,
      updated: p.data.updated,
      source: p.data.source || '',
      tags: Array.isArray(p.data.tags) ? p.data.tags : [],
      type: p.data.type === 'prompt' ? 'prompt' : 'guide',
      example: !!p.data.example,
      draft: !!p.data.draft,
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

// Calendar
const KINDS = { islamic: 'Islamic', national: 'Saudi', university: 'University', other: 'Other' };
const events = readMarkdownDir('content/calendar').map((e) => {
  need(e, ['title', 'date']);
  if (e.data.date && !isIsoDate(e.data.date)) problem(`${e.file}: "date" must look like 2027-02-08.`);
  if (e.data.end && !isIsoDate(e.data.end)) problem(`${e.file}: "end" must look like 2027-02-08.`);
  const kind = e.data.kind || 'other';
  if (!KINDS[kind]) problem(`${e.file}: "kind" must be one of ${Object.keys(KINDS).join(', ')}.`);
  if (!visible(e)) return null;
  return {
    slug: e.slug,
    title: e.data.title,
    arabic: e.data.arabic || '',
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
const plain = (html) => html.replace(/<[^>]+>/g, ' ')
  .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, e) => ENTITIES[e]).replace(/&[a-z#0-9]+;/gi, ' ')
  .replace(/\s+/g, ' ').trim();

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
}
for (const r of restaurants) r.noteHtml = md(r._body, 1);

for (const t of topics) {
  t.posts = posts.filter((p) => p.topic === t.slug);
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

const ctx = { site, topics, topicBySlug, posts, events, restaurants, link, depthOf, md, PREVIEW, TODAY, assetVersion: '' };

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
    p.html = md(p._body, 2);
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

// live-site extras
if (!PREVIEW) {
  const base = (site.url || '').replace(/\/$/, '');
  if (base) {
    const urls = written.map((k) => `  <url><loc>${base}/${k}</loc></url>`).join('\n');
    fs.writeFileSync(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
  }
}

const n = (k, one, many) => `${k} ${k === 1 ? one : many}`;
console.log(`Built ${n(written.length, 'page', 'pages')} into ${path.relative(ROOT, OUT)}/ (${n(posts.length, 'guide', 'guides')}, ${n(events.length, 'date', 'dates')}, ${n(restaurants.length, 'place', 'places')}${PREVIEW ? ', preview mode' : ''}).`);
