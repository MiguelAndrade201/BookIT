import { prisma } from './prisma';

export async function getBlockedRanges(propertyId: string) {
  const [blocks, bookings] = await Promise.all([
    prisma.calendarBlock.findMany({ where: { propertyId }, orderBy: { startDate: 'asc' } }),
    prisma.booking.findMany({
      where: { propertyId, status: { in: ['PENDING', 'CONFIRMED'] } },
      orderBy: { checkIn: 'asc' }
    })
  ]);

  return [
    ...blocks.map(b => ({ start: b.startDate, end: b.endDate, source: b.source, label: b.title ?? b.source })),
    ...bookings.map(b => ({ start: b.checkIn, end: b.checkOut, source: 'DIRECT', label: `Direct booking ${b.status}` }))
  ];
}

export async function isAvailable(propertyId: string, checkIn: Date, checkOut: Date) {
  const ranges = await getBlockedRanges(propertyId);
  const conflict = ranges.find(r => checkIn < r.end && r.start < checkOut);
  return { available: !conflict, conflict };
}
