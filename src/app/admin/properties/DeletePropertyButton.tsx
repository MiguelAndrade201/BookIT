'use client';

import { Trash2 } from 'lucide-react';
import { useFormStatus } from 'react-dom';

export function DeletePropertyButton({ propertyName }: { propertyName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-5 py-2 font-semibold text-red-700 transition hover:bg-red-50 focus-ring"
      onClick={event => {
        if (!confirm(`Delete ${propertyName}? This removes the property, bookings, calendar feeds, blocks, reviews, and uploaded images.`)) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="h-4 w-4" />
      {pending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
