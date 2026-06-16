import { GoogleMap } from '@/components/GoogleMap';
import { geocodeAddress } from '@/lib/googleMaps';

export async function ConfirmedBookingLocation({
  address,
  location
}: {
  address: string | null;
  location: string;
}) {
  const center = await geocodeAddress(address, location);

  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-5">
      <p className="label">Confirmed location</p>
      <h2 className="font-serif text-3xl">Exact address</h2>
      <p className="mt-3 font-semibold">{address ?? location}</p>
      <GoogleMap center={center} mode="exact" fallbackQuery={address ?? location} className="mt-4" />
    </section>
  );
}
