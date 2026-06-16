import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';
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

function parseAmenities(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

const amenityNameExceptions: Record<string, string> = {
  ac: 'AC',
  'air con': 'Air Con',
  'air conditioning': 'Air Conditioning',
  bbq: 'BBQ',
  cctv: 'CCTV',
  ev: 'EV Charging',
  'ev charging': 'EV Charging',
  'hot tub': 'Hot Tub',
  jacuzzi: 'Jacuzzi',
  tv: 'TV',
  wifi: 'WiFi',
  'wi-fi': 'WiFi',
  'wi fi': 'WiFi'
};

function titleCaseAmenity(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map(word => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(' ');
}

function normalizeAmenityName(value: string) {
  const compact = value.trim().replace(/\s+/g, ' ');
  const key = compact.toLowerCase();
  return amenityNameExceptions[key] ?? titleCaseAmenity(compact);
}

function amenityIconFor(name: string) {
  const key = name.toLowerCase();

  if (/\bcctv\b|security|camera/.test(key)) return 'Cctv';
  if (/\bwifi\b|wi-fi|internet|broadband/.test(key)) return 'Wifi';
  if (/\btv\b|television|netflix|streaming/.test(key)) return 'Tv';
  if (/parking|driveway|garage/.test(key)) return 'CircleParking';
  if (/kitchen|cooker|oven|stove|hob/.test(key)) return 'CookingPot';
  if (/coffee|espresso/.test(key)) return 'Coffee';
  if (/washer|washing|laundry/.test(key)) return 'WashingMachine';
  if (/bath|bathroom/.test(key)) return 'Bath';
  if (/shower/.test(key)) return 'ShowerHead';
  if (/hot tub|jacuzzi|pool|swim/.test(key)) return 'Waves';
  if (/air con|air conditioning|\bac\b|cooling/.test(key)) return 'Snowflake';
  if (/heating|fireplace|fire pit|log burner/.test(key)) return 'Flame';
  if (/garden|patio|terrace|outdoor|yard/.test(key)) return 'Trees';
  if (/bbq|barbecue|grill/.test(key)) return 'Flame';
  if (/pet|dog/.test(key)) return 'Dog';
  if (/baby|cot|crib|high chair/.test(key)) return 'Baby';
  if (/gym|fitness|weights/.test(key)) return 'Dumbbell';
  if (/wine|bar/.test(key)) return 'Wine';
  if (/key|self check|lockbox/.test(key)) return 'KeyRound';
  if (/bed|sleep/.test(key)) return 'BedDouble';

  return 'Sparkles';
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const name = String(formData.get('name') || '').trim();
    const slug = slugify(String(formData.get('slug') || name));
    const images = formData.getAll('images').filter((value): value is File => value instanceof File && value.size > 0);
    const amenities = Array.from(
      new Map(
        parseAmenities(formData.get('amenities'))
          .map(normalizeAmenityName)
          .map(amenityName => [amenityName.toLowerCase(), {
            name: amenityName,
            icon: amenityIconFor(amenityName)
          }])
      ).values()
    );

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
        instantBook: formData.get('instantBook') === 'on',
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
