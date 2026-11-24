const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' });
const longDateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** "Thu, 26 Nov · 21:00" */
export function formatShortDate(iso: string) {
  const d = new Date(iso);
  return `${dateFmt.format(d)} · ${timeFmt.format(d)}`;
}

/** Long, human range shown on the detail page. */
export function formatRange(startIso: string, endIso: string) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  if (sameDay(s, e)) return `${longDateFmt.format(s)}, ${timeFmt.format(s)} – ${timeFmt.format(e)}`;
  return `${longDateFmt.format(s)}, ${timeFmt.format(s)} – ${longDateFmt.format(e)}, ${timeFmt.format(e)}`;
}

export function formatPrice(price: number | null) {
  if (price === null || price === undefined) return null;
  if (price === 0) return 'Free';
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON', maximumFractionDigits: 2 }).format(price);
}

/** ISO (UTC) -> value for <input type="datetime-local"> in the browser's local time. */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** <input type="datetime-local"> value (local time) -> ISO UTC string for the API. */
export function fromLocalInput(value: string) {
  return new Date(value).toISOString();
}

/** <input type="date"> value -> ISO UTC at local start/end of that day. */
export function dateInputToIso(value: string, endOfDay = false) {
  const [y, m, d] = value.split('-').map(Number);
  const date = endOfDay ? new Date(y, m - 1, d, 23, 59, 59) : new Date(y, m - 1, d, 0, 0, 0);
  return date.toISOString();
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
