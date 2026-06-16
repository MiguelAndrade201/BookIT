'use client';

import { Phone, Mail, X } from 'lucide-react';
import { useState } from 'react';

type BookingItem = {
  id: string;
  guestName: string;
  initials: string;
  email: string;
  phone: string | null;
  property: string;
  checkIn: string;
  checkOut: string;
  total: string;
  status: string;
};

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function BookingsCalendar({ bookings }: { bookings: BookingItem[] }) {
  const [selected, setSelected] = useState<BookingItem | null>(null);
  const today = new Date();
  const start = addDays(today, -today.getDay());
  const days = Array.from({ length: 35 }, (_, index) => addDays(start, index));

  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-4 shadow-soft">
      <h2 className="font-serif text-2xl">Calendar view</h2>
      <div className="mt-4 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10 text-sm">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="bg-sand/40 p-2 text-center text-xs font-bold uppercase text-black/50">{day}</div>)}
        {days.map(day => {
          const dayBookings = bookings.filter(booking => new Date(booking.checkIn) <= day && new Date(booking.checkOut) > day);
          return (
            <div key={dateKey(day)} className="min-h-24 bg-white p-2">
              <div className="text-xs font-bold text-black/50">{day.getDate()}</div>
              <div className="mt-2 grid gap-1">
                {dayBookings.map(booking => (
                  <button key={booking.id} className="rounded bg-red-100 px-2 py-1 text-left text-xs font-bold text-red-800" type="button" onClick={() => setSelected(booking)}>
                    {booking.initials} · {booking.property}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="label">Booking</p><h3 className="font-serif text-2xl">{selected.guestName}</h3></div>
              <button className="rounded-xl border border-black/10 p-2" onClick={() => setSelected(null)}><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              <div><strong>Property:</strong> {selected.property}</div>
              <div><strong>Dates:</strong> {new Date(selected.checkIn).toLocaleDateString()} - {new Date(selected.checkOut).toLocaleDateString()}</div>
              <div><strong>Total:</strong> {selected.total}</div>
              <div><strong>Status:</strong> {selected.status}</div>
            </div>
            <div className="mt-5 flex gap-2">
              {selected.phone ? <a className="btn-secondary inline-flex flex-1 items-center justify-center gap-2" href={`tel:${selected.phone}`}><Phone className="h-4 w-4" /> Call</a> : null}
              <a className="btn-primary inline-flex flex-1 items-center justify-center gap-2" href={`mailto:${selected.email}`}><Mail className="h-4 w-4" /> Message</a>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
