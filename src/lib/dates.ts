import { differenceInCalendarDays, eachDayOfInterval, startOfDay } from 'date-fns';

export function nightsBetween(checkIn: Date, checkOut: Date) {
  return Math.max(0, differenceInCalendarDays(startOfDay(checkOut), startOfDay(checkIn)));
}

export function dateRangeNights(checkIn: Date, checkOut: Date) {
  const nights = nightsBetween(checkIn, checkOut);
  if (nights === 0) return [];
  const end = new Date(checkOut);
  end.setDate(end.getDate() - 1);
  return eachDayOfInterval({ start: startOfDay(checkIn), end: startOfDay(end) });
}

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}
