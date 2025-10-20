import { describe, it, expect } from 'vitest';
import {
  addDays,
  formatDate,
  getDaysInMonth,
  getMonthDates,
  isDateInRange,
  isHoliday,
  isWeekend,
  parseMonth,
} from '../../utils/dateUtils';

describe('dateUtils', () => {
  it('calculates the correct number of days in a month, including leap years', () => {
    expect(getDaysInMonth(2024, 1)).toBe(29); // February 2024
    expect(getDaysInMonth(2025, 1)).toBe(28); // February 2025
  });

  it('identifies weekends correctly', () => {
    expect(isWeekend(new Date('2025-02-01'))).toBe(true); // Saturday
    expect(isWeekend(new Date('2025-02-03'))).toBe(false); // Monday
  });

  it('currently treats all days as non-holidays', () => {
    expect(isHoliday(new Date('2025-01-01'))).toBe(false);
  });

  it('parses months and formats calendar dates consistently', () => {
    const parsed = parseMonth('2025-07');
    expect(parsed.getFullYear()).toBe(2025);
    expect(parsed.getMonth()).toBe(6); // July
    expect(parsed.getDate()).toBe(1);

    const formatted = formatDate(new Date('2025-07-01T00:00:00Z'));
    expect(formatted).toBe('2025-07-01');
  });

  it('returns all dates in a month in chronological order', () => {
    const dates = getMonthDates(2025, 0); // January 2025
    expect(dates).toHaveLength(31);
    expect(dates[0].getDate()).toBe(1);
    expect(dates[0].getMonth()).toBe(0);
    const last = dates.at(-1)!;
    expect(last.getDate()).toBe(31);
    expect(last.getMonth()).toBe(0);
  });

  it('adds days to a date without mutating the original reference', () => {
    const base = new Date('2025-03-10T00:00:00Z');
    const result = addDays(base, 5);
    expect(formatDate(result)).toBe('2025-03-15');
    expect(formatDate(base)).toBe('2025-03-10'); // unchanged
  });

  it('checks if a date lies within an inclusive range', () => {
    const date = new Date('2025-04-15');
    const start = new Date('2025-04-10');
    const end = new Date('2025-04-20');
    expect(isDateInRange(date, start, end)).toBe(true);
    expect(isDateInRange(new Date('2025-04-09'), start, end)).toBe(false);
  });
});
