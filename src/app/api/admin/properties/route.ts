import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { dollarsToCents, slugify } from '@/lib/admin';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

function cleanExtension(file: File) {
  const extension = path.extname(file.name).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(extension)) return extension;
  if (file.type === 'image/png') return '.png';
  if (file.type === 'image/webp') return '.webp';
  if (file.type === 'image/gif') return '.gif';
  return '.jpg';
}

async function saveImage(file: File, slug: string, index: number) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image uploads are supported.');
  }

  const uploadsDir = path.join(process.cwd(), 'uploads', 'properties', slug);
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${String(index + 1).padStart(2, '0')}-${crypto.randomUUID()}${cleanExtension(file)}`;
  const filePath = path.join(uploadsDir, filename);
  const bytes = Buffer.from(await file.arrayBuffer());

  await writeFile(filePath, bytes);
  return `/uploads/properties/${slug}/${filename}`;
}

function errorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'That URL slug is already in use.';
    return `Database error ${error.code}: ${error.message}`;
  }

  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown server error while creating property.';
  }
}

function parseAmenities(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = String(formData.get('name') || '').trim();
    const slug = slugify(String(formData.get('slug') || name));
    const images = formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0);
    const amenities = Array.from(new Set(parseAmenities(formData.get('amenities'))));

    if (!name) return NextResponse.json({ error: 'Property name is required.' }, { status: 400 });
    if (!slug) return NextResponse.json({ error: 'A valid URL slug is required.' }, { status: 400 });
    if (!images.length) return NextResponse.json({ error: 'Upload at least one property image.' }, { status: 400 });

    const imageUrls = [];
    for (const [index, image] of images.entries()) {
      imageUrls.push(await saveImage(image, slug, index));
    }

    const property = await prisma.property.create({
      data: {
        name,
        slug,
        tagline: String(formData.get('tagline')),
        location: String(formData.get('location')),
        address: String(formData.get('address') || ''),
        description: String(formData.get('description')),
        maxGuests: Number(formData.get('maxGuests')),
        bedrooms: Number(formData.get('bedrooms')),
        bathrooms: Number(formData.get('bathrooms')),
        baseNightlyRate: dollarsToCents(formData.get('baseNightlyRate')),
        cleaningFee: dollarsToCents(formData.get('cleaningFee')),
        serviceFee: 0,
        minNights: Number(formData.get('minNights') || 1),
        instantBook: formData.get('instantBook') === 'on',
        weekendRate: formData.get('weekendRate') ? dollarsToCents(formData.get('weekendRate')) : null,
        bankHolidayRate: formData.get('bankHolidayRate') ? dollarsToCents(formData.get('bankHolidayRate')) : null,
        hostId: String(formData.get('hostId') || '') || null,
        heroImage: imageUrls[0],
        status: String(formData.get('status') || 'DRAFT'),
        images: {
          create: imageUrls.map((url, index) => ({
            url,
            alt: `${name} image ${index + 1}`,
            sortOrder: index + 1
          }))
        },
        amenities: amenities.length ? {
          create: amenities.map(amenityName => ({
            amenity: {
              connectOrCreate: {
                where: { name: amenityName },
                create: { name: amenityName }
              }
            }
          }))
        } : undefined
      }
    });

    return NextResponse.json({ propertyId: property.id });
  } catch (error) {
    const message = errorMessage(error);
    console.error('Property creation failed:', error);

    if (message === 'That URL slug is already in use.') {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
