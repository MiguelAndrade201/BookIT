import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { dollarsToCents, statusBadgeClass } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';

function parseAmenities(value: FormDataEntryValue | null) {
  return String(value || '')
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

async function updateProperty(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const amenities = Array.from(new Set(parseAmenities(formData.get('amenities'))));

  await prisma.$transaction(async tx => {
    await tx.property.update({
      where: { id },
      data: {
        name: String(formData.get('name')),
        slug: String(formData.get('slug')),
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
        heroImage: String(formData.get('heroImage')),
        status: String(formData.get('status'))
      }
    });

    await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
    for (const amenityName of amenities) {
      const amenity = await tx.amenity.upsert({
        where: { name: amenityName },
        update: {},
        create: { name: amenityName }
      });
      await tx.propertyAmenity.create({ data: { propertyId: id, amenityId: amenity.id } });
    }
  });

  redirect('/admin/properties');
}

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id }, include: { bookings: true, feeds: true, amenities: { include: { amenity: true } } } });
  if (!property) notFound();

  return (
    <div>
      <AdminPageHeader
        eyebrow="Inventory"
        title={`Edit ${property.name}`}
        description="Update listing content, rates, capacity, and publishing status."
        action={<Link href="/admin/properties" className="btn-secondary">Back</Link>}
      />
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className={statusBadgeClass(property.status)}>{property.status}</span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-black/55 ring-1 ring-black/10">{property.bookings.length} bookings</span>
        <span className="rounded-full bg-white px-3 py-1 font-semibold text-black/55 ring-1 ring-black/10">{property.feeds.length} feeds</span>
      </div>

      <form action={updateProperty} className="mt-6 grid gap-5 rounded-xl border border-black/10 bg-white p-5 shadow-soft">
        <input type="hidden" name="id" value={property.id} />
        <section className="grid gap-4 lg:grid-cols-2">
          <input className="input" name="name" defaultValue={property.name} required />
          <input className="input" name="slug" defaultValue={property.slug} required />
          <input className="input" name="location" defaultValue={property.location} required />
          <input className="input" name="address" defaultValue={property.address ?? ''} />
          <input className="input lg:col-span-2" name="tagline" defaultValue={property.tagline} required />
          <textarea className="input min-h-32 lg:col-span-2" name="description" defaultValue={property.description} required />
          <input className="input lg:col-span-2" name="heroImage" defaultValue={property.heroImage} required />
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <input className="input" name="maxGuests" type="number" min="1" defaultValue={property.maxGuests} required />
          <input className="input" name="bedrooms" type="number" min="0" defaultValue={property.bedrooms} required />
          <input className="input" name="bathrooms" type="number" min="0" step=".5" defaultValue={property.bathrooms} required />
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <input className="input" name="baseNightlyRate" type="number" min="0" step=".01" defaultValue={property.baseNightlyRate / 100} required />
          <input className="input" name="cleaningFee" type="number" min="0" step=".01" defaultValue={property.cleaningFee / 100} />
          <select className="input" name="status" defaultValue={property.status}>
            <option value="DRAFT">Draft</option>
            <option value="LIVE">Live</option>
          </select>
        </section>
        <section>
          <textarea className="input min-h-24" name="amenities" defaultValue={property.amenities.map(({ amenity }) => amenity.name).join('\n')} />
        </section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-black/55">Current public rate: <strong>{formatMoney(property.baseNightlyRate)}</strong> per night</p>
          <button className="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
