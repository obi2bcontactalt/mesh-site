# MESH: Medina English Student Hub

The website for English-speaking students in Madinah. Guides, a Hijri/Gregorian calendar with countdowns, study prompts, a restaurant map and a form for questions.

## Changing the site

Most changes are made by asking Claude in the MESH claude.ai Project. Claude edits these files, checks the result and pushes; the live site updates about a minute later.

Small text fixes can also be made straight on GitHub: open a file in `content/`, press the pencil icon, edit, and commit. If the file breaks a rule (a missing title, a wrong date format), the Cloudflare build fails and the live site keeps its previous version, so nothing goes down.

## Where things are

| What | Where |
| --- | --- |
| Guides | `content/posts/<topic>/` |
| Calendar dates | `content/calendar/` |
| Restaurants | `content/restaurants/` |
| Topic names and intros | `content/topics/` |
| Site name, live URL, form key | `site.json` |
| Look and feel | `assets/site.css` |

The full rules (formats, writing style, design) are in [CLAUDE.md](CLAUDE.md).

## Building it yourself

Needs Node 20 or newer, nothing else.

```
node build.mjs                 # live site → dist/
node build.mjs --preview       # with example content → dist-preview/
node tools/serve.mjs dist      # view at http://localhost:4321
```

Cloudflare Pages settings: build command `node build.mjs`, output directory `dist`.
