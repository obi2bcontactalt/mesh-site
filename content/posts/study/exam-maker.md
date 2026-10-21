---
title: Exam maker
summary: Turns your book or mind maps into a practice exam page you can take on your phone, matched to your teacher's exam, with scores and explanations.
updated: 2026-10-21
type: prompt
order: 2
tags: [ai, prompt, exam, test, practice exam, quiz, true false, multiple choice, claude, artifact, revision, امتحان, اختبار]
---
Use this in **Claude**, because it builds the exam as a page with its own link that you can take on your phone and share with classmates.

````prompt Exam maker
Build me an online practice exam as a single published HTML page (artifact).

**Source and scope**

- Source: the attached [book / mind map .md files]. If both are attached, use the book as the authority and the mind map for structure and coverage.
- Cover: from [start section] to [end section] ([included / excluded]). Write "all" for the whole material.
- Exclude: [anything not examined, or "nothing"].
- Ask only about content inside this scope, as the source states it. Do not add outside knowledge, and skip passages where the text is garbled or unclear.

**Questions**
- [40] true/false and [40] multiple-choice (4 options each).
- Difficulty: hard.
- Before writing, scan the scope and list what this subject actually tests: definitions, classifications, conditions, steps, numbers, names linked to ideas, disputes and the preferred view. Spread the questions across every section in proportion to how much it covers, not just the first chapters.
  - **Any other subject:** definitions, classifications, causes and effects, comparisons and sequences.
- True/false: many statements should be "almost right", with a view attributed to the wrong person or group, a ruling or definition slightly altered, an order swapped, or a number changed. Aim for roughly 40% true.
- Multiple choice: distractors must be real items from the same section (the other opinions, the neighboring term, the similar sect, the adjacent step), never obvious throwaways. Include some "which of these is NOT…" questions.
- Do not quote long evidence (verses or hadiths) as the question unless the material requires memorizing it.
- Shuffle the options in a fixed, seeded order so the correct letter is spread evenly across the four positions and stays the same on reload.
- Every question needs a short explanation from the source: why the answer is right and, where useful, whose view or which term the wrong choice actually belongs to.

**Behavior**
- No login or account features: a plain static page that anyone with the link can use. Do not declare any runtime capabilities.
- Show no answers or feedback until the user submits.
- If questions are unanswered at submit, show an in-page warning; a second click submits anyway.
- After submitting:
  - show the total score, the percentage, a score for each section, the number wrong and the number unanswered
  - mark each question correct, wrong or unanswered
  - highlight the correct option and show the explanation
- Add a "show mistakes only" toggle and a "retake" button that clears everything.
- Save progress in browser storage as a convenience only, wrapped in try/catch.

**Presentation**
- Language: [Arabic (RTL, Arabic-Indic numerals ١، ٢، ٣) / English].
- Show a small topic tag (chapter or section) on each question.
- Put a fixed bottom bar with a progress count and the submit button.
- It must work well on a phone, in both light and dark mode.
- Give the page a title naming the subject and scope, e.g. "اختبار الفرق – الباب الأول".

**Sharing**
- Publish it as an artifact so I get a link. Remind me to set the link to "anyone with the link" in the Share menu.

Before publishing, check the question counts, the spread of correct letters, and that every section in the scope is represented.
````

## How to use it

> [!IMPORTANT]
> Use it in the **same project** as your book (and your mind maps), then **update the instructions to match your teacher and his exam**: which chapters, what's included and excluded, and the question types he uses.

1. **Open the same Claude Project** where you uploaded the book. If you made mind maps with the [mind map maker](/study/mind-map-maker/), upload the `.md` files too.
2. **Fill in the brackets** to match the real exam:
   - **Cover:** e.g. *from chapter 3 to chapter 7, including chapter 7*
   - **Exclude:** e.g. *the section on X, the introduction*
   - **Questions:** the types and numbers your teacher uses: multiple choice, true/false, written questions, matching. The prompt starts with 40 true/false and 40 multiple choice; change them. For written questions, add a line such as *"Add 5 short written questions with a model answer shown after submitting."*
   - **Language:** Arabic or English
3. **Save it in the project instructions** once it matches your teacher, so every exam you make for that subject follows his style. Just change the chapters next time.
4. **Send it.** Claude builds the exam and gives you a link.
5. **Share it** with classmates: open the Share menu and set it to *anyone with the link*.

## Tips and tricks

- **Describe the teacher.** Add what you know: *"He likes questions on definitions and the differences between views"*, *"Most of his true/false statements are almost right"*, *"He always asks for lists of conditions."* The closer it is to his style, the more useful the practice.
- **Take it like the real exam.** Answers only show after you submit. Then use **show mistakes only** to revise just what you got wrong.
- **Ask for a fresh exam** on the same scope once you're scoring well, so you're not just memorising the answers.
- **Narrow it down** before the exam: *"Make a new exam only from the sections I got wrong."*
- **Check explanations against the book.** Each answer explains itself from the source, but AI can still make mistakes, especially with names, numbers and who held which view.
- **Progress is saved on your phone**, so you can stop and come back. **Retake** clears everything.
