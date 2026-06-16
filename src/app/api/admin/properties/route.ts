import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { normalizeAmenities } from '@/lib/amenities';
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

  const filename = `${String(index + 1).padStart(2, '0')}-${crypto.randomUUID()}${cleanExtension(file)}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const dataUrl = `data:${file.type || 'image/jpeg'};base64,${bytes.toString('base64')}`;

  if (process.env.VERCEL) return dataUrl;

  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'properties', slug);
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, filename);
    await writeFile(filePath, bytes);
    return `/uploads/properties/${slug}/${filename}`;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EROFS') {
      return dataUrl;
    }

    throw error;
  }
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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = String(formData.get('name') || '').trim();
    const slug = slugify(String(formData.get('slug') || name));
    const images = formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0);
    const amenities = normalizeAmenities(formData.get('amenities'));

    if (!name) return NextResponse.json({ error: 'Property name is required.' }, { status: 400 });
    if (!slug) return NextResponse.json({ error: 'A valid URL slug is required.' }, { status: 400 });
    if (!images.length) return NextResponse.json({ error: 'Upload at least one property image.' }, { status: 400 });

    const requestedHostId = String(formData.get('hostId') || '');
    const host = requestedHostId && requestedHostId !== 'env-super-admin'
      ? await prisma.user.findFirst({
        where: {
          id: requestedHostId,
          role: { in: ['SUPER_ADMIN', 'ADMIN'] }
        },
        select: { id: true }
      })
      : null;

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
        instantBook: formData.get('bookingMode') !== 'APPROVAL',
        weekendRate: formData.get('weekendRate') ? dollarsToCents(formData.get('weekendRate')) : null,
        bankHolidayRate: formData.get('bankHolidayRate') ? dollarsToCents(formData.get('bankHolidayRate')) : null,
        hostId: host?.id ?? null,
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
          create: amenities.map(amenity => ({
            amenity: {
              connectOrCreate: {
                where: { name: amenity.name },
                create: { name: amenity.name, icon: amenity.icon }
              }
            }
          }))
        } : undefined
      }
    });

    revalidatePath('/');
    revalidatePath('/admin/properties');
    revalidatePath('/admin/calendars');
    revalidatePath(`/properties/${property.slug}`);

    return NextResponse.json({ propertyId: property.id, slug: property.slug });
  } catch (error) {
    const message = errorMessage(error);
    console.error('Property creation failed:', error);

    if (message === 'That URL slug is already in use.') {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
