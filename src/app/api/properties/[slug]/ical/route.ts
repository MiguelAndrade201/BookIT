import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function fmt(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function escapeText(value: string) {
  return value.replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n');
}

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const property = await prisma.property.findUnique({ where: { slug }, include: { bookings: true, blocks: true } });
  if (!property) return new NextResponse('Not found', { status: 404 });

  const events = [
    ...property.bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status)).map(b => ({
      uid: `direct-${b.id}@letsbookit`,
      start: b.checkIn,
      end: b.checkOut,
      summary: `Direct booking - ${b.status}`
    })),
    ...property.blocks.map(b => ({
      uid: `block-${b.id}@letsbookit`,
      start: b.startDate,
      end: b.endDate,
      summary: b.title ?? `${b.source} block`
    }))
  ];

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lets Book It//Direct Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    ...events.flatMap(event => [
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${fmt(event.start)}`,
      `DTEND;VALUE=DATE:${fmt(event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      'END:VEVENT'
    ]),
    'END:VCALENDAR'
  ].join('\r\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${property.slug}.ics"`
    }
  });
}
