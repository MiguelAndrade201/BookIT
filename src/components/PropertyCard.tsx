import Link from 'next/link';
import { formatMoney } from '@/lib/money';

export function PropertyCard({ property }: { property: any }) {
  return (
    <Link href={`/properties/${property.slug}`} className="card block overflow-hidden transition hover:-translate-y-1 hover:shadow-xl">
      <img src={property.heroImage} alt={property.name} className="h-56 w-full object-cover" />
      <div className="p-5">
        <div className="font-serif text-2xl">{property.name}</div>
        <div className="mt-1 text-sm text-black/60">{property.location}</div>
        <p className="mt-3 line-clamp-2 text-sm text-black/70">{property.tagline}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm">Sleeps {property.maxGuests} · {property.bedrooms} beds</span>
          <span className="font-semibold">from {formatMoney(property.baseNightlyRate)}/night</span>
        </div>
      </div>
    </Link>
  );
}
