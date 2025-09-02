const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'] as const;
export type MonthAbbrev = typeof MONTH_NAMES[number];

// very tolerant month extraction from "outbound_dates" like "Nov", "Nov–Dec", "Feb 10–20"
export function extractMonths(s?: string | null): MonthAbbrev[] {
  if (!s) return [];
  const hits = MONTH_NAMES.filter((m) => new RegExp(`\\b${m}\\b`, 'i').test(s));
  return Array.from(new Set(hits));
}

export { MONTH_NAMES };

