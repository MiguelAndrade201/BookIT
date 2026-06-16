'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type BlockedRange = {
  start: string;
  end: string;
};

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function sameMonth(a: Date, b: Date) {
  return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function dayOverlapsRange(day: Date, range: { start: Date; end: Date }) {
  const dayEnd = addDays(day, 1);
  return day < range.end && range.start < dayEnd;
}

function monthDays(month: Date) {
  const monthStart = startOfMonth(month);
  const gridStart = addDays(monthStart, -monthStart.getDay());
  const monthEnd = endOfMonth(month);
  const gridEnd = addDays(monthEnd, 6 - monthEnd.getDay());
  const days = [];

  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    days.push(day);
  }

  return days;
}

export function AvailabilityCalendar({ ranges }: { ranges: BlockedRange[] }) {
  const [monthIndex, setMonthIndex] = useState(0);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const month = addMonths(todayStart, monthIndex);
  const parsedRanges = ranges.map(range => ({ start: new Date(range.start), end: new Date(range.end) }));

  return (
    <section className="mx-auto max-w-lg rounded-xl border border-black/10 bg-white p-3 sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white p-2 text-ink disabled:opacity-35"
          onClick={() => setMonthIndex(current => Math.max(0, current - 1))}
          disabled={monthIndex === 0}
          aria-label="Previous month"
          title="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="text-center font-serif text-2xl">{month.toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</h3>
        <button
          type="button"
          className="rounded-xl border border-black/10 bg-white p-2 text-ink disabled:opacity-35"
          onClick={() => setMonthIndex(current => Math.min(5, current + 1))}
          disabled={monthIndex === 5}
          aria-label="Next month"
          title="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-black/45">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => <div key={`${day}-${index}`}>{day}</div>)}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {monthDays(month).map(day => {
          const isCurrentMonth = sameMonth(day, month);
          const isPast = day < todayStart;
          const isBlocked = parsedRanges.some(range => dayOverlapsRange(day, range));

          return (
            <div
              key={day.toISOString()}
              className={[
                'flex h-8 items-center justify-center rounded-lg text-sm font-semibold sm:h-9 md:h-10',
                isCurrentMonth ? 'text-black/75' : 'text-black/25',
                isPast ? 'bg-black/10 text-black/35' : isBlocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-800'
              ].join(' ')}
              title={isPast ? 'Past date' : isBlocked ? 'Unavailable' : 'Available'}
              aria-label={`${day.toLocaleDateString('en-GB')} ${isPast ? 'past date' : isBlocked ? 'unavailable' : 'available'}`}
            >
              {day.getDate()}
            </div>
          );
        })}
      </div>
    </section>
  );
}
