'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export function DayPricingEditor({
  date,
  day,
  price,
  propertyId,
  month,
  action
}: {
  date: string;
  day: number;
  price: string;
  propertyId: string;
  month: string;
  action: (formData: FormData) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="flex h-full min-h-24 w-full flex-col rounded-lg border border-blue-200 bg-blue-50 p-2 text-left hover:bg-blue-100" onClick={() => setOpen(true)}>
        <span className="text-sm font-bold">{day}</span>
        <span className="mt-auto text-xs font-semibold text-blue-900">{price}</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setOpen(false)}>
          <form action={action} className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div><p className="label">Day pricing</p><h3 className="font-serif text-2xl">Edit {date}</h3></div>
              <button type="button" className="rounded-xl border border-black/10 p-2" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="date" value={date} />
            <label><span className="label">Nightly price GBP</span><input className="input mt-1" name="price" type="number" min="0" step=".01" required /></label>
            <button className="btn-primary mt-4 w-full">Save Price</button>
          </form>
        </div>
      ) : null}
    </>
  );
}
