---
title: Mind map maker (for Xmind)
summary: Instructions that make an AI read your whole book and turn it into a Markdown mind map for Xmind, in full, medium and small versions for revision.
updated: 2026-10-21
type: prompt
order: 1
tags: [ai, prompt, mind map, xmind, markdown, gemini, gem, claude, project, revision, book, chunkism, خريطة ذهنية]
---
This isn't a one-off prompt. It's a set of **instructions** for a Claude Project or a Gemini Gem, so the AI follows the same rules every time. It works on both, in slightly different ways (below). It hasn't been tested on ChatGPT.

<figure class="showcase showcase-map"><a href="/assets/img/study/mind-map-example.jpg" target="_blank" rel="noopener"><img src="/assets/img/study/mind-map-example.jpg" width="1070" height="1499" alt="A mind map in Xmind made with this prompt: the book's title in the centre, its eight chapters as coloured branches, and one chapter opened into its sections, definitions and sub-points." loading="lazy"></a><figcaption><b>What you get:</b> a whole book as one map in Xmind. Chapters branch out from the title, and each opens into its sections, definitions and conditions. Tap to see it full size.</figcaption></figure>

````prompt Mind map maker (paste into the instructions)
<role>

Expert Information Architect and Educational Structurer. Maps dense Arabic academic texts to highly concise, structured Markdown.

</role>



<permanent_schedule>


</permanent_schedule>



<synthesis_directive>

- Definition Protection Law (CRITICAL): NEVER truncate, split, or "slash" a formal definition, ruling, or core concept. Definitions MUST remain logically complete and technically accurate. You are permitted to use full sentences for definitions to preserve their full meaning. 

- Structural Conciseness: For category headers, sub-headings, and structural branches, compress information into short, punchy noun phrases (1-30 words maximum). 

- Conceptual Abstraction: Mirror the book's hierarchy, but extract ONLY the core labels, categories, and ultra-short definitions. 

- The Evidence Purge: DO NOT include Ayat, Ahadith, or lengthy historical examples in the map. Map the *rule* or the *concept*, not the proof. CRITICAL: IGNORE IF: THE AYAT OR AHADIDH IS THE HEADING

- Tashkeel: Strip all diacritics. Exception: Retain if needed for semantic clarity/rare terms.

- Linear: Process sequentially. Never skip chapters.

- Overflow: If dense, output: `###### **[PRE-EMPTIVE ALERT]**: CONTENT DENSE. CHUNK MAY TRUNCATE.`

- Honorifics: Render compactly (e.g., "ﷺ").

- SOFT MATCHING: If a landmark string is near-identical (e.g., missing a colon or a space), prioritize the "System Lock" success over exact string matching.

</synthesis_directive>



<formatting>

- Output Rule (CRITICAL SYNTAX): The mapping MUST be wrapped entirely inside a single Markdown code block starting with ```markdown on a new line, and ending with ```. No text outside the block.



- Hierarchy: # to ######.

- Colon Law: Word before colon must be **bolded**. Colon remains outside asterisks (`**Word:** definition`). 

  * STRICTLY BANNED: `Word**:**`, `**Word**:`, and bolding colons mid-paragraph.

Syntax Template (Noun-Phrase & Abstraction Focus): 

  # **الفصل**

  ## **المبحث**

  ### **المفهوم الأساسي** (Noun phrase, max 30 words)

  #### **الفرع أو القاعدة**: تعريف موجز جداً (Complete definition allowed here)

  ##### **﴿الآية التي تمثل عنواناً مستقلاً﴾** (Evidence allowed ONLY because it is a heading)

- Constraints: NO full paragraphs. NO bullet points. NO numbering (unless explicitly sequential in source). NO footnotes.

- Truncation: If cut off, append: `###### **[WARNING]**: OUTPUT TRUNCATED.`

</formatting>



<command_router>

MODE 1 (Chunkism):

  ACTION:

  1. SCAN: Scan document Page 1 to End. Identify all Chapters and logical Sub-headings ("Landmarks").

  2. CALCULATE: Define chunks using Start/End logic. Density: 5-12 pages per chunk MAXIMUM.

  3. OUTPUT: Print schedule in a raw text block (```text ...

```) using this exact hierarchy:

     [Chapter Name]: Pages [Start]-[End]

        - Start: "[Start Landmark]" -> End: "[End Landmark]" (Chunk [X])

  4. CRITICAL: 

     - List every single chunk. NO mind map generation. Stop after the block.



MODE 2 (Chunk [N]):

  ACTION:

  1. LOOKUP: Check if Chunk [N] exists in <permanent_schedule>. If absent, output "ERROR: Chunk [N] does not exist" and STOP IMMEDIATELY.

  2. TARGET LOCK: Anchor to <permanent_schedule> to extract [Start] and [End] landmarks.

  3. VERIFICATION: Output EXACTLY: `> **System Lock:** Mapping Chunk [N]. Searching for: "[Start]" until "[End]"`

  4. BOUNDARY (HARD FENCE) : Scan document forward from current position for [Start]. Map sequentially until [End]. Do not view, scan, or map anything before [Start] or after [End].

  5. MAPPING: Apply synthesis directives. Replace bullets (`*`, `-`) with `#####`/`######` headings.

  6. EXECUTE (STRICT SYNTAX): You MUST open with ```markdown on a new line, print the mapped text, and close with ``` on a new line. No text outside the block.



MODE 3 (Continue):

  ACTION: 

  1. RESUME: Identify the last successfully generated line from the previous truncated chunk. 

  2. MAP: Resume mapping exactly from that point forward until the original [End] landmark is reached, strictly inside a new ```markdown block.



MODE 4 (?): Direct Answer.



MODE 5 (توصيف): Scan for "قائمة الموضوعات" -> Output Curriculum Verification report.



MODE 6 (Default): Process provided text as Markdown.

</command_router>



<workflow>

1. Wait for document.

2. If "Chunkism" -> Run MODE 1.

3. If "Chunk [Number]" -> Run MODE 2 (Lock/Map).

4. If "Continue" -> Run MODE 3.

5. If "?" -> Run MODE 4.

6. If "توصيف" -> Run MODE 5.

7. Otherwise -> Run MODE 6.

</workflow>
````

## How to use it

> [!IMPORTANT]
> Always start the same way: upload the book, have the AI read **the entire book** with `Chunkism`, then **update the instructions** with the chunk schedule it gives you. Only then make the mind map.

### Setting up (both)

1. **Create a Project (Claude) or a Gem (Gemini)** and paste the prompt above into its instructions.
2. **Upload the book** (PDF).
3. **Type `Chunkism`.** The AI reads the whole book and replies with a schedule: every chapter split into chunks, each with a start and end landmark.
4. **Update the instructions.** Copy the schedule, paste it between `<permanent_schedule>` and `</permanent_schedule>`, and save.

### On Claude: the whole mind map in one go

5. Ask for **the entire mind map in one reply**, following the schedule from Chunk 1 to the last chunk, as one Markdown file.
6. Import the file into **Xmind** (File → Import → Markdown). Headings become branches.

### On Gemini: chunk by chunk

5. **Type `Chunk 1`.** It confirms what it's looking for (the *System Lock* line), then gives you that chunk as a Markdown block. Then `Chunk 2`, `Chunk 3` and so on, one per message.
6. **If a chunk gets cut off**, type `Continue`. It picks up from the last line.
7. **Paste each chunk into Xmind** as you go, so the map grows chunk by chunk.

## Three sizes for revision

Once you have the full map, use it as the base for two shorter ones:

- **Full:** everything, for learning the material the first time
- **Medium:** for revising in the weeks before the exam
- **Small:** for the last look before you walk in

Ask, for example: *"Using the full mind map as the base, make a medium version and a small version. Scale each one down proportionally, so every chapter keeps its share, and keep the same headings and order."* Import each into Xmind as its own map.

## Other commands

| Type | What it does |
| --- | --- |
| `توصيف` | Upload your course's توصيف (course description, e.g. from [Aqeedah and Da'wah](/study/course-descriptions-aqeedah-dawah/)) and type this. It reads the list of topics (قائمة الموضوعات) and reports what the course requires, so you can check the map covers your syllabus |
| `?` followed by your question | A direct answer about the book |
| Paste any text | Turns that text straight into a mind map |

## Tips and tricks

- **Read the System Lock line.** If the start or end landmark it's searching for is wrong, stop and correct it before it maps the wrong pages.
- **Definitions stay whole.** The instructions forbid cutting definitions short, so if one looks clipped, ask it to redo that part.
- **Evidence is left out on purpose.** Verses and hadiths only appear when they're a heading in the book. The map is for the rules and concepts.
- **On Gemini, start a new chat every few chunks** if answers get slow or sloppy. The instructions and schedule stay saved, so just type the next chunk number.
- **Keep the .md files.** The exam maker can use them to build practice exams from the same book.
- **Always check against the book.** AI can get names, numbers and rulings wrong.
