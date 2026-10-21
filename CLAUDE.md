# MESH website: rules for Claude

Read this before changing anything. It keeps the site consistent no matter which chat or which helper makes the change.

## What MESH is

- **MESH = Medina English Student Hub.** A resource hub for English-speaking students in Madinah, especially at the Islamic University, and their families.
- It replaces the Telegram group t.me/IslamicUniversityInfo, because most students here don't use Telegram.
- Run by a few student volunteers. **Not an official university site.** The footer says so; keep it.
- The owner asks for changes in the claude.ai Project "Website Maker And Maintenance". Claude edits this repo, builds, checks, and pushes to `main`. Cloudflare (a Worker named `mesh`) rebuilds the live site automatically: https://mesh.obi2b-contact-alt.workers.dev

## How the site is built

- **No dependencies.** `node build.mjs` (Node 20+) turns `content/` into `dist/`. Nothing to install, nothing to update. Don't add npm packages, a framework or a CMS without asking the owner first.
- `node build.mjs --preview` builds `dist-preview/`: shows `example: true` and `draft: true` content and links straight to `index.html` files (used for the claude.ai preview artifact).
- `node tools/serve.mjs dist` serves a build at http://localhost:4321 for screenshots.
- If a content file is wrong, the build stops and lists exactly what to fix.

```
site.json              name, description, live URL, Web3Forms key, map landmarks
wrangler.jsonc         Cloudflare settings: serve dist/, use 404.html. Keep "name": "mesh"
build.mjs              loads + checks content, renders pages, writes search index/sitemap
tools/templates.mjs    every page's HTML (header, footer, home, topic, post, ask, about, 404)
tools/lib/             front matter parser, Hijri/Gregorian dates
tools/vendor/          marked (Markdown parser, MIT), vendored on purpose
tools/telegram_digest.py   turns a Telegram export into readable digest files
assets/site.css        all styles; design tokens at the top
assets/site.js         theme, menu, search, copy buttons, countdowns, calendar, map, form
assets/img/            logo, icons, images used in guides
content/topics/        the 8 topics (order, titles, Arabic, intro)
content/posts/<topic>/ guides, one Markdown file each
content/calendar/      one file per date
content/restaurants/   one file per place
```

## Content formats

Front matter is one `key: value` per line. Lists use `[a, b, c]`. Dates are `YYYY-MM-DD`. File names are lowercase with hyphens and become the URL.

**Guide** `content/posts/visas/iqama-renewal.md` → `/visas/iqama-renewal/`
```
---
title: Renewing your iqama
summary: One sentence saying what this guide answers.
updated: 2026-10-21
source: From the Telegram group, checked October 2026
tags: [iqama, residency]
type: guide           (guide | prompt)
order: 1              (optional: fixes the position in the topic's list)
---
Body in Markdown.
```
- `updated` changes every time the facts change. Readers rely on it.
- `type: prompt` is for AI prompts (with a ` ```prompt ` block). On a topic page the guides come first, then an "AI prompts" section. Both are collapsible lists: titles only, tap to see the description and the Read guide / Copy prompt buttons. Owner wants the sections to flow together, not as contrasting blocks. Owner's choice: prompts are not featured on the home page.
- `example: true` or `draft: true` = visible only in the preview build.

**Date** `content/calendar/1448-2-finals.md`
```
---
title: "Start of final exams"
arabic: بداية الاختبارات النهائية
term: Second semester     (First semester | Second semester | Summer semester)
date: 2027-04-25
end: 2027-05-01           (optional, for ranges)
kind: university
---
Optional note, only if the university calendar has one.
```
- **The calendar shows the university's academic calendar only.** No Islamic or national dates that aren't on it. Titles are faithful translations of the university's own wording, with the Arabic original in `arabic`.
- **Passed dates are removed.** The build skips them and the page hides any that pass between builds; delete their files when you're next in the calendar folder. When a new academic calendar is published, replace the files with the new one.
- Hijri labels are generated automatically (Umm al-Qura) and match the university's calendar.

**Restaurant** `content/restaurants/al-tazaj-quba.md`
```
---
name: Place name
arabic: optional Arabic name
area: Near the University
cuisine: Yemeni
price: budget          (budget | mid | treat)
lat: 24.4846
lng: 39.5632
tags: [Family section, Breakfast]
maps: https://maps.app.goo.gl/...   (optional; otherwise built from lat/lng)
---
One or two lines: what to order, when to go.
```
Coordinates must come from the owner or a shared maps link. Never guess a location.

**Markdown extras**
- ` ```prompt Label ` … ` ``` ` makes a prompt card with a Copy button.
- `> [!TIP]`, `> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]` on the first line of a quote make a callout. Use WARNING for anything with legal or money consequences.
- Link to other pages as `/visas/iqama-renewal/`; images live in `assets/img/` and are linked as `/assets/img/name.jpg`. The build makes them relative.
- Headings in a guide start at `##`.

## Writing

- Plain English, short sentences, sentence case. Many readers are non-native speakers: everyday words, and explain local terms on first use ("iqama, your residency permit").
- Address the reader as "you". Titles say what the guide answers ("Renewing your iqama", not "Iqama info").
- Structure: what it is, what you need, the steps, where to confirm. Lists over long paragraphs.
- Arabic touches are welcome (topic and event names, the salam, du'a), and must be correct. Don't machine-translate whole guides.
- **Never invent facts**: no fees, deadlines, office locations, phone numbers, procedures or rulings that the owner, a submitted message, or an official source didn't give. Link the official source when there is one. If unsure, ask the owner.
- No religious rulings written by us. Link to the scholar or official source the owner provides.
- Privacy: don't publish students' names, phone numbers or photos from Telegram without the owner confirming consent. Never publish passport or iqama numbers.

## Design rules

The look comes from the MESH logo. Keep it.

- **Tokens live only in the `:root` block of `assets/site.css`.** Components use tokens, never literal colours. Every change works in light (sand) and dark (logo green) themes.
- **Colours:** logo green `#0F5A3B`, deep green `#0A4129`, logo gold `#E6B141`, sand `#F1EBDD`, ink `#0C3B27`. Gold is for highlights and the main button. On sand, gold text uses `--gold-ink`.
- **Type:** Archivo for English, at its normal width (the owner found the wide cut too stretched; `--wide` is `normal`). Display text is 800–900 weight; body is 400. Arabic uses IBM Plex Sans Arabic (weight 500) through the `.ar` class, chosen for legibility; the owner found the decorative Kufi hard to read. No other fonts.
- **The lattice** (the pattern from the logo) appears only in the hero, the green bands and the map. Nowhere else.
- **One bold thing per page:** the giant MESH on the home page, the topic name on topic pages. Everything around it stays quiet.
- **Motion** is limited to what exists (owner approved all of it): the home entrance, the wordmark drifting on scroll, the footer letters rising, topic rows sweeping on hover, page transitions, the theme reveal, plus small ambient touches: a gold light drifting along the lattice in the hero and green bands, a glint on the gold rule, the rotating search hint, a light passing over the next-date card with a breathing countdown, arrows nudging in on the topic list, rippling map pins and turning landmark diamonds. Don't add fade-ins to sections. Everything switches off with reduced motion.
- No emoji in the interface. Icons come only from the set in `tools/templates.mjs`.
- Button words stay the same everywhere: "Ask MESH", "Share a tip", "Copy prompt", "Directions", "Send to MESH".
- Must work at 360px wide with no sideways scrolling, with a keyboard, and in both themes.

## Before pushing

1. `node build.mjs` and `node build.mjs --preview` both finish without problems.
2. Serve the build and screenshot every changed page at 390px and 1280px, light and dark. Look at them.
3. Commit with a plain message, e.g. `Add guide: renewing your iqama`.
4. Push to `main`. Cloudflare deploys in about a minute.
5. Tell the owner what changed, with the page address.

## How the owner sends content

The owner sends items **one at a time** (a screenshot, a message, a file, a photo, a link). For each one:

1. Work out what it is and where it belongs (which topic, which guide, or a calendar date / restaurant).
2. If a guide on that subject exists, update it. Otherwise create one. Many small items can build up one guide over time.
3. **Duplicates:** if the new item covers the same thing as existing content and is newer, replace the old information without asking. Keep the existing file and address (so shared links keep working), rewrite it with the new facts, and update `updated`. If two existing guides cover the same thing, merge them into the newer one's facts and delete the other file. Decide "newer" from the dates shown (message dates, document dates); if it isn't clear which is newer, ask.
4. Build, check, push, and reply briefly: what was added or changed, where it went (with the page link), and anything that was replaced or removed.
5. Ask only when something is genuinely unclear: which version is current, a missing location, or content that might not be shareable.

## Moving the Telegram group over

Usually the owner sends screenshots one by one (see above); the export below is the alternative when a computer is available.

1. The owner exports the group from **Telegram Desktop** (chat menu → Export chat history → format **JSON**, media optional) and uploads `result.json`.
2. `python3 -I tools/telegram_digest.py result.json /tmp/digest` (keep exports out of the repo).
3. Read the digest in parts. Sort useful messages into the 8 topics, merge repeated questions into one guide each, and note anything that looks out of date.
4. Show the owner a list of proposed guides (title, topic, source messages) before writing them.
5. Write approved guides with `source: From the Telegram group, <month year>` and today's `updated` date. Restaurants need coordinates from a maps link.

## Things only the owner does

Cloudflare settings, buying a domain, the Web3Forms account (its access key goes in `site.json` → `formAccessKey`; it's meant to be public), and giving helpers GitHub access. After adding a domain, update `url` in `site.json`.
