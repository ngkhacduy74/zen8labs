import { DateTime } from 'luxon';

export function getDayOfWeek0_6(input: string | Date, zone: string): number {
  const dt =
    input instanceof Date
      ? DateTime.fromJSDate(input).setZone(zone)
      : DateTime.fromISO(input).setZone(zone);

  return dt.weekday % 7; 
}

export function getMinutesOfDay(input: string | Date, zone: string): number {
  const dt =
    input instanceof Date
      ? DateTime.fromJSDate(input).setZone(zone)
      : DateTime.fromISO(input).setZone(zone);

  return dt.hour * 60 + dt.minute;
}
