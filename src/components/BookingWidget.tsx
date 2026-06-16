'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import { AvailabilityCalendar } from './AvailabilityCalendar';

type BookingWidgetProps = {
  propertyId?: string;
  propertySlug?: string;
  compact?: boolean;
  locations?: string[];
  selectedLocation?: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: string;
  calendarRanges?: { start: string; end: string }[];
};

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function BookingWidget({
  propertyId,
  propertySlug,
  compact = false,
  locations = [],
  selectedLocation = '',
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  calendarRanges = []
}: BookingWidgetProps) {
  const router = useRouter();
  const today = dateInputValue(new Date());
  const defaultCheckIn = initialCheckIn ?? today;
  const defaultCheckOut = initialCheckOut ?? dateInputValue(addDays(new Date(), 3));
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(initialGuests ?? '4');
  const [location, setLocation] = useState(selectedLocation);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkOutMin = checkIn ? dateInputValue(addDays(new Date(`${checkIn}T00:00:00`), 1)) : today;

  function updateCheckIn(value: string) {
    setCheckIn(value);
    const nextMinimum = dateInputValue(addDays(new Date(`${value}T00:00:00`), 1));
    if (!checkOut || checkOut <= value) {
      setCheckOut(nextMinimum);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const params = new URLSearchParams({ checkIn, checkOut, guests });
    if (location) params.set('location', location);

    if (propertySlug && propertyId) {
      setChecking(true);
      const availabilityParams = new URLSearchParams({ propertyId, checkIn, checkOut });
      const response = await fetch(`/api/availability?${availabilityParams.toString()}`, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      setChecking(false);

      if (!response.ok || !result?.available) {
        setError('Those dates are not available. Please choose another stay.');
        return;
      }
    }

    router.push(propertySlug ? `/properties/${propertySlug}/book?${params.toString()}` : `/?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className={propertySlug ? 'rounded-xl border border-black/10 bg-white p-4 shadow-soft md:p-5' : 'card p-4 md:p-5'}>
      <div className={compact ? 'grid gap-3 sm:grid-cols-2' : 'grid gap-3 md:grid-cols-4'}>
        <label className="min-w-0">
          <span className="label">Check-in</span>
          <input
            className="input date-input mt-1 h-12"
            type="date"
            min={today}
            value={checkIn}
            onChange={e => updateCheckIn(e.target.value)}
            required
          />
        </label>
        <label className="min-w-0">
          <span className="label">Check-out</span>
          <input
            className="input date-input mt-1 h-12"
            type="date"
            min={checkOutMin}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            required
          />
          <span className="mt-1 block text-[11px] font-semibold text-black/45">After {checkIn}</span>
        </label>
        <label className="min-w-0"><span className="label">Guests</span><select className="input mt-1 h-12" value={guests} onChange={e => setGuests(e.target.value)}>{Array.from({ length: 12 }, (_, i) => i + 1).map(n => <option key={n}>{n}</option>)}</select></label>
        {locations.length ? (
          <label className="min-w-0">
            <span className="label">Location</span>
            <select className="input mt-1 h-12" value={location} onChange={e => setLocation(e.target.value)}>
              <option value="">All locations</option>
              {locations.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      {error ? <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
      <div className="mt-3 flex flex-col justify-end gap-3 sm:flex-row">
        {propertySlug ? <button className="btn-secondary text-center md:min-w-52" type="button" onClick={() => setCalendarOpen(true)}>Check Host Calendar</button> : null}
        <button className="btn-primary md:min-w-52" type="submit" disabled={checking}>{checking ? 'Checking...' : propertySlug ? 'Book Now' : 'Check Availability'}</button>
      </div>
      {calendarOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-3 py-3 sm:px-4 sm:py-4" role="dialog" aria-modal="true" aria-labelledby="host-calendar-title" onClick={() => setCalendarOpen(false)}>
          <div className="w-full max-w-xl rounded-xl bg-white p-3 shadow-2xl sm:p-4 md:p-5" onClick={event => event.stopPropagation()}>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <p className="label">Availability</p>
                <h2 id="host-calendar-title" className="font-serif text-2xl md:text-3xl">Host Calendar</h2>
              </div>
              <button className="rounded-xl border border-black/10 bg-white p-2 text-ink" type="button" onClick={() => setCalendarOpen(false)} aria-label="Close calendar" title="Close calendar">
                <X className="h-5 w-5" />
              </button>
            </div>
            <AvailabilityCalendar ranges={calendarRanges} />
          </div>
        </div>
      ) : null}
    </form>
  );
}
