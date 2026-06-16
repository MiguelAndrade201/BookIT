import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PublicNav } from '@/components/PublicNav';
import { BookingWidget } from '@/components/BookingWidget';
import { GoogleMap } from '@/components/GoogleMap';
import { PropertyGallery } from '@/components/PropertyGallery';
import { PropertySummary } from '@/components/PropertySummary';
import { getBlockedRanges } from '@/lib/availability';
import { formatMoney } from '@/lib/money';
import { geocodeAddress } from '@/lib/googleMaps';
import { Car, Flame, KeyRound, MapPin, Shirt, Sparkles, Star, Utensils, Waves, Wifi, Wine } from 'lucide-react';

const amenityIcons = { Car, Flame, KeyRound, Shirt, Sparkles, Utensils, Waves, Wifi, Wine };

function AmenityIcon({ icon }: { icon: string }) {
  const Icon = amenityIcons[icon as keyof typeof amenityIcons] ?? Sparkles;
  return <Icon className="mb-3 h-6 w-6 text-sage" />;
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [property, privateLocation] = await Promise.all([
    prisma.property.findUnique({
      where: { slug },
      select: {
        slug: true,
        name: true,
        id: true,
        tagline: true,
        location: true,
        description: true,
        maxGuests: true,
        bedrooms: true,
        bathrooms: true,
        baseNightlyRate: true,
        heroImage: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, alt: true }
        },
        reviews: {
          select: { id: true, rating: true, body: true, guestName: true }
        },
        amenities: {
          include: { amenity: true }
        }
      }
    }),
    prisma.property.findUnique({
      where: { slug },
      select: { address: true, location: true }
    })
  ]);
  if (!property) notFound();

  const [mapCenter, blockedRanges] = await Promise.all([
    geocodeAddress(privateLocation?.address, privateLocation?.location ?? property.location),
    getBlockedRanges(property.id)
  ]);
  const publicBlockedRanges = blockedRanges.map(range => ({ start: range.start.toISOString(), end: range.end.toISOString() }));

  return (
    <main>
      <PublicNav />
      <section className="relative overflow-hidden bg-ink text-white">
        <img src={property.heroImage} alt={property.name} className="absolute inset-0 h-full w-full object-cover opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:grid lg:grid-cols-[1fr_520px] lg:gap-10 lg:px-8 lg:py-24">
          <div className="self-center">
            <p className="mb-3 flex items-center gap-2 text-white/80"><MapPin size={18} />{property.location}</p>
            <h1 className="font-serif text-5xl leading-tight md:text-7xl">{property.name}</h1>
            <p className="mt-5 max-w-2xl text-xl text-white/85">{property.tagline}</p>
          </div>
          <div className="mt-8 text-ink lg:mt-0"><BookingWidget propertySlug={property.slug} compact calendarRanges={publicBlockedRanges} /></div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <PropertyGallery images={property.images} />
        <div className="card p-6">
          <h2 className="font-serif text-3xl">Property highlights</h2>
          <p className="mt-3 text-black/70">{property.description}</p>
          <div className="mt-5"><PropertySummary property={property} /></div>
          <p className="mt-5 font-semibold">From {formatMoney(property.baseNightlyRate)} per night</p>
        </div>
      </section>

      {property.amenities.length ? (
        <section id="amenities" className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <h2 className="font-serif text-4xl">Amenities</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {property.amenities.map(({ amenity }) => (
              <div key={amenity.id} className="rounded-xl border border-black/10 bg-white/80 p-5">
                <AmenityIcon icon={amenity.icon} />
                <div className="font-semibold">{amenity.name}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {property.reviews.length ? (
        <section id="reviews" className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <h2 className="font-serif text-4xl">Guest Reviews</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {property.reviews.map(review => (
              <div key={review.id} className="card p-6">
                <div className="mb-3 flex text-yellow-500">{Array.from({ length: review.rating }).map((_, i) => <Star key={i} fill="currentColor" size={18} />)}</div>
                <p className="text-black/75">"{review.body}"</p>
                <div className="mt-4 text-sm font-semibold">- {review.guestName}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section id="location" className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="grid gap-6 rounded-xl border border-black/10 bg-white/85 p-6 shadow-soft md:grid-cols-2">
          <div>
            <p className="label">Location</p>
            <h2 className="font-serif text-4xl">Explore {property.location}</h2>
            <p className="mt-4 text-black/70">
              The map shows the approximate area within about 200 metres. The full address is shared after payment confirmation.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-cream px-4 py-2 text-sm font-semibold text-black/65">
              <MapPin className="h-4 w-4 text-sage" />
              {property.location}
            </p>
          </div>
          <GoogleMap center={mapCenter} mode="approximate" fallbackQuery={property.location} />
        </div>
      </section>
    </main>
  );
}
