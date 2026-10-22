#!/usr/bin/env node
// Writes the main Islamic dates for a Hijri year into content/calendar/,
// using the Umm al-Qura calendar (the official Saudi calendar).
//   node tools/islamic-dates.mjs 1449
// The dates are marked "expected": Ramadan, the Eids and Dhul Hijjah are
// confirmed by moon sighting, so check the announcement and correct the file
// (keep the file name) if it moves by a day.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const year = Number(process.argv[2]);
if (!year) { console.error('Usage: node tools/islamic-dates.mjs <Hijri year, e.g. 1449>'); process.exit(1); }

const fmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
const toIso = (d) => d.toISOString().slice(0, 10);
const lookup = new Map();
for (let t = Date.UTC(2020, 0, 1); t < Date.UTC(2040, 0, 1); t += 86400000) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(t)).map((x) => [x.type, x.value]));
  lookup.set(`${parseInt(p.year, 10)}-${Number(p.month)}-${Number(p.day)}`, toIso(new Date(t)));
}
const g = (y, m, d) => lookup.get(`${y}-${m}-${d}`);

const DATES = [
  ['islamic-new-year', 1, 1, `Islamic New Year ${year}`, `رأس السنة الهجرية ${year.toLocaleString('ar-SA', { useGrouping: false })}`],
  ['ashura', 1, 10, 'Day of Ashura', 'يوم عاشوراء'],
  ['ramadan', 9, 1, 'Start of Ramadan', 'بداية شهر رمضان'],
  ['last-ten-nights', 9, 21, 'Last ten days of Ramadan begin', 'العشر الأواخر من رمضان'],
  ['eid-al-fitr', 10, 1, 'Eid al-Fitr', 'عيد الفطر'],
  ['dhul-hijjah', 12, 1, 'First ten days of Dhul Hijjah begin', 'عشر ذي الحجة'],
  ['arafah', 12, 9, 'Day of Arafah', 'يوم عرفة'],
  ['eid-al-adha', 12, 10, 'Eid al-Adha', 'عيد الأضحى'],
];
for (const [slug, m, d, title, arabic] of DATES) {
  const date = g(year, m, d);
  const file = path.join(ROOT, 'content/calendar', `islamic-${year}-${slug}.md`);
  fs.writeFileSync(file, `---\ntitle: "${title}"\narabic: ${arabic}\ndate: ${date}\nkind: islamic\nexpected: true\n---\n`);
  console.log(date, title);
}
