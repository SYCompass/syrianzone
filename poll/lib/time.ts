import { formatInTimeZone } from "date-fns-tz";

export function getLocalMidnightUTC(timezone: string, date = new Date()): Date {
  const isoWithOffset = formatInTimeZone(date, timezone, "yyyy-MM-dd'T'00:00:00XXX");
  return new Date(isoWithOffset);
}

export function getMonthStartUTC(timezone: string, date = new Date()): Date {
  const isoWithOffset = formatInTimeZone(date, timezone, "yyyy-MM-01'T'00:00:00XXX");
  return new Date(isoWithOffset);
}


