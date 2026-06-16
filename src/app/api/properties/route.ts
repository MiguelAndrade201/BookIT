import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const properties = await prisma.property.findMany({ where: { status: 'LIVE' }, include: { images: true, amenities: { include: { amenity: true } } } });
  return NextResponse.json({ properties });
}
