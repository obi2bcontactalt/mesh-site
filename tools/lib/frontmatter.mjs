// Reads the block between the two `---` lines at the top of a content file.
// Supported values (one per line):
//   key: plain text
//   key: "quoted text"
//   key: [one, two, "three, with comma"]
//   key: true | false
//   key: 12.5
// Dates stay as plain text (YYYY-MM-DD).

export function parseFrontmatter(src, file) {
  const m = src.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n([\s\S]*))?$/);
  if (!m) throw new Error(`${file}: the file must start with a front matter block between two "---" lines.`);
  const data = {};
  m[1].split(/\r?\n/).forEach((line, i) => {
    const t = line.trim();
    if (!t || t.startsWith('#')) return;
    const mm = line.match(/^([A-Za-z][\w-]*)\s*:\s*(.*)$/);
    if (!mm) throw new Error(`${file}: front matter line ${i + 2} should look like "key: value" but is: ${line}`);
    data[mm[1]] = parseValue(mm[2].trim());
  });
  return { data, body: (m[2] || '').trim() };
}

function parseValue(v) {
  if (v === '') return '';
  if (v.startsWith('[') && v.endsWith(']')) {
    return splitList(v.slice(1, -1)).map(parseValue).filter((x) => x !== '');
  }
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

function splitList(s) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of s) {
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      cur += ch;
    } else if (ch === ',') {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
