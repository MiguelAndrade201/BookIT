import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import { nightsBetween } from '@/lib/dates';
import { isAvailable } from '@/lib/availability';
import BookingForm from './BookingForm';

function parseDateInput(value?: string) {
  return value ? new Date(`${value}T00:00:00`) : new Date('');
}

export default async function BookPage({ params, searchParams }: { params: Promise<{ slug: string }>, searchParams: Promise<Record<string,string|undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const property = await prisma.property.findUnique({ where: { slug } });
  if (!property) notFound();

  const checkIn = parseDateInput(sp.checkIn);
  const checkOut = parseDateInput(sp.checkOut);
  const guests = Number(sp.guests ?? 1);
  const nights = nightsBetween(checkIn, checkOut);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const datesAreValid = nights >= property.minNights && checkIn >= todayStart && guests > 0 && guests <= property.maxGuests;
  const availability = datesAreValid ? await isAvailable(property.id, checkIn, checkOut) : { available: false, conflict: null };
  const total = property.baseNightlyRate * nights + property.cleaningFee;

  return (
    <main className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="card p-6">
          <h1 className="font-serif text-4xl">Reserve {property.name}</h1>
          <p className="mt-2 text-black/60">{property.location} - {guests} guests - {nights} nights</p>
          <div className="mt-6 rounded-2xl bg-white p-5">
            <div className="flex justify-between"><span>Nightly rate x {nights}</span><span>{formatMoney(property.baseNightlyRate * nights)}</span></div>
            <div className="mt-2 flex justify-between"><span>Cleaning fee</span><span>{formatMoney(property.cleaningFee)}</span></div>
            <div className="mt-4 flex justify-between border-t pt-4 text-xl font-bold"><span>Total</span><span>{formatMoney(total)}</span></div>
          </div>
          {!availability.available ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-red-700">Those dates are unavailable or below the {property.minNights}-night minimum. Please go back and choose new dates.</div>
          ) : (
            <BookingForm propertyId={property.id} checkIn={sp.checkIn!} checkOut={sp.checkOut!} guests={guests} nights={nights} nightlyRate={property.baseNightlyRate} cleaningFee={property.cleaningFee} total={total} />
          )}
        </div>
      </div>
    </main>
  );
}
