---
title: AI mind map maker
summary: Turns a lecture, a chapter or your notes into a clean mind map you can view, print or revise from.
updated: 2026-10-21
tags: [ai, prompts, mind maps]
featured: true
example: true
---
Copy the prompt, paste it into any AI chat (Claude, ChatGPT or Gemini), then paste your notes or a chapter underneath it.

```prompt Mind map maker
You are helping a student at the Islamic University of Madinah revise.

Turn the material I paste below into a mind map.

Rules:
- Use a Markdown outline: one # for the main topic, ## for each main branch, then bullet points for details.
- Keep each point under 10 words.
- Keep Arabic terms in Arabic, followed by a short English meaning in brackets.
- Put definitions, conditions and lists exactly as they appear in the material.
- Add a final branch called "Likely exam questions" with 5 questions.

Only output the outline, nothing else.

Material:
```

## Seeing it as a map

Copy the outline the AI gives you and paste it into [markmap](https://markmap.js.org/repl). It draws the mind map instantly, and you can download it as an image.

## Tips

- One lesson per mind map works better than a whole subject at once.
- If the map is too crowded, ask: "Make it shorter. Keep only what's likely to be examined."
- Always check the output against your notes. AI can get details wrong, especially with names, numbers and rulings.
