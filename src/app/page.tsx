import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PublicNav } from '@/components/PublicNav';
import { BookingWidget } from '@/components/BookingWidget';
import { PropertyCard } from '@/components/PropertyCard';
import { TrustBar } from '@/components/TrustBar';
import { isAvailable } from '@/lib/availability';
import { nightsBetween } from '@/lib/dates';

function parseDateInput(value?: string) {
  return value ? new Date(`${value}T00:00:00`) : null;
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const allProperties = await prisma.property.findMany({ where: { status: 'LIVE' }, include: { reviews: true }, orderBy: { createdAt: 'asc' } });
  const locations = Array.from(new Set(allProperties.map(property => property.location))).sort();
  const checkIn = parseDateInput(sp.checkIn);
  const checkOut = parseDateInput(sp.checkOut);
  const location = sp.location ?? '';
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const hasAvailabilitySearch = Boolean(checkIn && checkOut && checkIn >= todayStart && nightsBetween(checkIn, checkOut) > 0);
  const locationMatches = location ? allProperties.filter(property => property.location === location) : allProperties;
  const properties = hasAvailabilitySearch
    ? (await Promise.all(locationMatches.map(async property => ({
      property,
      availability: await isAvailable(property.id, checkIn!, checkOut!)
    })))).filter(({ availability }) => availability.available).map(({ property }) => property)
    : locationMatches;
  const primary = allProperties[0];
  return (
    <main>
      <PublicNav />
      <section className="relative overflow-hidden bg-ink text-white">
        {primary ? <img src={primary.heroImage} alt="Vacation rental" className="absolute inset-0 h-full w-full object-cover opacity-55" /> : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <h1 className="font-serif text-5xl leading-tight md:text-7xl">Cheaper Stays, Booked Direct</h1>
            <p className="mt-5 max-w-xl text-xl text-white/85">Skip Airbnb-style platform fees, get the best direct price, and help hosts keep more of every booking.</p>
          </div>
          <div className="mt-8 max-w-4xl text-ink">
            <BookingWidget
              locations={locations}
              selectedLocation={location}
              initialCheckIn={sp.checkIn}
              initialCheckOut={sp.checkOut}
              initialGuests={sp.guests}
            />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 lg:px-8"><TrustBar /></section>
      <section id="properties" className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div><p className="label">{hasAvailabilitySearch ? 'Available properties' : 'Direct booking properties'}</p><h2 className="font-serif text-4xl">{hasAvailabilitySearch ? 'Available for your dates' : 'Choose a fee-free escape'}</h2></div>
          {primary ? <Link className="btn-secondary hidden md:block" href={`/properties/${primary.slug}`}>View Featured Property</Link> : null}
        </div>
        {properties.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{properties.map(p => <PropertyCard key={p.id} property={p} />)}</div>
        ) : (
          <div className="rounded-xl border border-black/10 bg-white p-6 text-black/70">No properties are available for those dates. Try adjusting your search.</div>
        )}
      </section>
      <section className="bg-sage text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[1fr_auto] lg:px-8">
          <div><h2 className="font-serif text-4xl">Book direct, save more</h2><p className="mt-3 text-white/80">Every confirmed stay earns a discount code for your next trip, with the best price shown upfront.</p></div>
          <Link href="/#properties" className="self-center rounded-2xl bg-white px-6 py-4 font-semibold text-sage">View All Properties -&gt;</Link>
        </div>
      </section>
    </main>
  );
}
