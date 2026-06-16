import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { formatMoney } from '@/lib/money';
import BookingForm from '@/app/properties/[slug]/book/BookingForm';

export default async function CustomBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await prisma.customBookingLink.findUnique({ where: { token }, include: { property: true } });
  if (!link || link.status !== 'OPEN') notFound();
  const nights = Math.max(1, Math.round((link.checkOut.getTime() - link.checkIn.getTime()) / 86400000));

  return (
    <main className="min-h-screen bg-cream px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="card p-6">
          <p className="label">Custom booking</p>
          <h1 className="font-serif text-4xl">{link.property.name}</h1>
          <div className="mt-4 rounded-xl bg-white p-4">
            <div className="flex justify-between"><span>Dates</span><strong>{link.checkIn.toLocaleDateString()} - {link.checkOut.toLocaleDateString()}</strong></div>
            <div className="mt-2 flex justify-between"><span>Guests</span><strong>{link.guests}</strong></div>
            <div className="mt-2 flex justify-between text-xl"><span>Total</span><strong>{formatMoney(link.total)}</strong></div>
          </div>
          <BookingForm propertyId={link.property.id} checkIn={link.checkIn.toISOString().slice(0, 10)} checkOut={link.checkOut.toISOString().slice(0, 10)} guests={link.guests} nights={nights} nightlyRate={Math.round(link.total / nights)} cleaningFee={0} total={link.total} customBookingToken={link.token} />
        </div>
      </div>
    </main>
  );
}
