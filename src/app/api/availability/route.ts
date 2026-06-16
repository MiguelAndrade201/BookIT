import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAvailable, getBlockedRanges } from '@/lib/availability';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get('propertyId');
  const checkIn = url.searchParams.get('checkIn');
  const checkOut = url.searchParams.get('checkOut');
  if (!propertyId) return NextResponse.json({ error: 'propertyId is required' }, { status: 400 });
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  if (checkIn && checkOut) return NextResponse.json(await isAvailable(propertyId, new Date(checkIn), new Date(checkOut)));
  return NextResponse.json({ blocks: await getBlockedRanges(propertyId) });
}
