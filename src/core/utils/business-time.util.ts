import dayjs from 'dayjs';
import timezonePlugin from 'dayjs/plugin/timezone';
import utcPlugin from 'dayjs/plugin/utc';

dayjs.extend(utcPlugin);
dayjs.extend(timezonePlugin);

export const BUSINESS_TIMEZONE = process.env.BUSINESS_TIMEZONE || 'Asia/Damascus';

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type BusinessDayName = (typeof DAY_NAMES)[number];

export function businessDayName(date: Date): BusinessDayName {
  return DAY_NAMES[dayjs(date).tz(BUSINESS_TIMEZONE).day()];
}

export function businessMinutesOfDay(date: Date): number {
  const zoned = dayjs(date).tz(BUSINESS_TIMEZONE);
  return zoned.hour() * 60 + zoned.minute();
}

export function startOfBusinessDay(date: Date = new Date()): Date {
  return dayjs(date).tz(BUSINESS_TIMEZONE).startOf('day').toDate();
}

export function endOfBusinessDay(date: Date = new Date()): Date {
  return dayjs(date).tz(BUSINESS_TIMEZONE).endOf('day').toDate();
}


export function atBusinessTime(date: Date, hour: number, minute = 0): Date {
  return dayjs(date)
    .tz(BUSINESS_TIMEZONE)
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toDate();
}

export function parseWallClock(value?: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}
