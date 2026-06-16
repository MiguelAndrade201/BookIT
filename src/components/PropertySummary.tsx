import { Bath, BedDouble, Users } from 'lucide-react';

export function PropertySummary({ property }: { property: { maxGuests: number; bedrooms: number; bathrooms: number; name: string } }) {
  const items = [
    [Users, `${property.maxGuests} Guests`],
    [BedDouble, `${property.bedrooms} Bedrooms`],
    [Bath, `${property.bathrooms} Bathrooms`]
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(([Icon, label]) => (
        <div key={label} className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-black/10 bg-white/80 px-2 py-4 text-center md:min-h-28 lg:min-h-24 xl:min-h-28">
          <Icon className="mb-2 h-6 w-6 text-sage md:h-7 md:w-7 lg:h-6 lg:w-6 xl:h-7 xl:w-7" />
          <div className="max-w-full whitespace-nowrap text-[clamp(0.72rem,1.8vw,1rem)] font-semibold leading-tight lg:text-[0.82rem] xl:text-[0.95rem]">{label}</div>
        </div>
      ))}
    </div>
  );
}
