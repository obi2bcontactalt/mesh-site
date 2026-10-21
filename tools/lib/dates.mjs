// Hijri dates use the Umm al-Qura calendar (the official Saudi calendar),
// built into Node and every modern browser. The client copy lives in
// assets/site.js — keep the month names in both places identical.

export const HIJRI_MONTHS = [
  'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
  'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah',
];

const hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
  day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC',
});

export function isIsoDate(s) {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
}

export function toDate(iso) {
  return new Date(iso + 'T00:00:00Z');
}

export function hijri(iso) {
  const p = Object.fromEntries(hijriFmt.formatToParts(toDate(iso)).map((x) => [x.type, x.value]));
  const day = Number(p.day);
  const month = Number(p.month);
  const year = parseInt(p.year, 10);
  return { day, month, year, text: `${day} ${HIJRI_MONTHS[month - 1]} ${year}` };
}

export function gregorian(iso, opts = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-GB', { ...opts, timeZone: 'UTC' }).format(toDate(iso));
}

// Today's date in Madinah, as YYYY-MM-DD.
export function todayInMadinah() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
}

export function daysBetween(fromIso, toIso) {
  return Math.round((toDate(toIso) - toDate(fromIso)) / 86400000);
}
