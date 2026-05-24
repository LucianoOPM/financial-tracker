import { RRule } from "rrule";

// ─── Types ────────────────────────────────────────────────────────────────────

type Frequency = "daily" | "weekly" | "monthly" | "yearly";

const FREQ_MAP = {
  daily: RRule.DAILY,
  weekly: RRule.WEEKLY,
  monthly: RRule.MONTHLY,
  yearly: RRule.YEARLY,
} as const;

// ─── Date formatting ──────────────────────────────────────────────────────────

/**
 * Formats a Date as "YYYY-MM-DD" using UTC date parts.
 * Required for Drizzle `date` columns which store/compare as strings.
 */
export function formatDateForDB(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a UTC midnight Date.
 * Avoids timezone-induced day shifts when creating Date from a date-only string.
 */
export function parseDateFromDB(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// ─── Next execution date ──────────────────────────────────────────────────────

/**
 * Calculates the next execution date after `current` using rrule (RFC 5545).
 * Handles all edge cases: month-end overflow (Jan 31 → Feb 28/29),
 * leap years, DST-safe (uses UTC internally).
 */
export function calculateNextExecutionDate(
  current: Date,
  frequency: Frequency,
  intervalValue: number,
): Date {
  const dtstart = new Date(
    Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), current.getUTCDate()),
  );

  const rule = new RRule({
    freq: FREQ_MAP[frequency],
    interval: intervalValue,
    dtstart,
    count: 2,
  });

  const occurrences = rule.all();
  // occurrences[0] === dtstart (current), occurrences[1] === next
  return occurrences[1] ?? current;
}

// ─── End date guard ───────────────────────────────────────────────────────────

/**
 * Returns true when the given executionDate is past the recurring's endDate.
 * endDate is a "YYYY-MM-DD" string or null/undefined (no expiry).
 */
export function isPastEndDate(
  endDate: string | null | undefined,
  executionDate: Date,
): boolean {
  if (!endDate) return false;
  return formatDateForDB(executionDate) > endDate;
}
