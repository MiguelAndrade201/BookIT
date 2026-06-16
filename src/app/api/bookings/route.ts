import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isAvailable } from '@/lib/availability';
import { nightsBetween } from '@/lib/dates';

const schema = z.object({
  propertyId: z.string(), firstName: z.string(), lastName: z.string(), email: z.string().email(), phone: z.string().optional().nullable(),
  checkIn: z.string(), checkOut: z.string(), guests: z.number(), nights: z.number(), nightlyRate: z.number(), cleaningFee: z.number(), total: z.number(), customBookingToken: z.string().optional().nullable(), promoCode: z.string().optional().nullable(), notes: z.string().optional().nullable()
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const data = parsed.data;
  const checkIn = new Date(`${data.checkIn}T00:00:00`);
  const checkOut = new Date(`${data.checkOut}T00:00:00`);
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const property = await prisma.property.findUnique({ where: { id: data.propertyId } });
  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  const customLink = data.customBookingToken ? await prisma.customBookingLink.findUnique({ where: { token: data.customBookingToken } }) : null;
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < property.minNights || checkIn < todayStart) return NextResponse.json({ error: `Dates must be in the future and at least ${property.minNights} nights` }, { status: 400 });
  if (data.guests < 1 || data.guests > property.maxGuests) return NextResponse.json({ error: 'Guest count is not allowed for this property' }, { status: 400 });
  const availability = await isAvailable(data.propertyId, checkIn, checkOut);
  if (!availability.available) return NextResponse.json({ error: 'Dates unavailable', conflict: availability.conflict }, { status: 409 });
  const total = customLink?.status === 'OPEN' ? customLink.total : property.baseNightlyRate * nights + property.cleaningFee;
  const notes = [data.promoCode ? `Promo code: ${data.promoCode}` : null, data.notes || null].filter(Boolean).join('\n\n') || undefined;
  const guest = await prisma.guest.create({ data: { firstName: data.firstName, lastName: data.lastName, email: data.email, phone: data.phone ?? undefined } });
  const booking = await prisma.booking.create({ data: { propertyId: data.propertyId, guestId: guest.id, checkIn, checkOut, guests: data.guests, nights, nightlyRate: property.baseNightlyRate, cleaningFee: property.cleaningFee, serviceFee: 0, taxes: 0, total, notes, status: property.instantBook ? 'CONFIRMED' : 'PENDING' } });
  if (customLink) await prisma.customBookingLink.update({ where: { id: customLink.id }, data: { status: 'USED' } });
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendars');
  revalidatePath(`/properties/${property.slug}`);
  return NextResponse.json({ bookingId: booking.id, status: booking.status });
}
