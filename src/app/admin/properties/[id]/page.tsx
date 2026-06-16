import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { notFound, redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { normalizeAmenities } from '@/lib/amenities';
import { dollarsToCents, statusBadgeClass } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function updateProperty(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const amenities = normalizeAmenities(formData.get('amenities'));

  await prisma.$transaction(async tx => {
    const property = await tx.property.update({
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
        minNights: Number(formData.get('minNights') || 1),
        instantBook: formData.get('bookingMode') !== 'APPROVAL',
        weekendRate: formData.get('weekendRate') ? dollarsToCents(formData.get('weekendRate')) : null,
        bankHolidayRate: formData.get('bankHolidayRate') ? dollarsToCents(formData.get('bankHolidayRate')) : null,
        hostId: String(formData.get('hostId') || '') || null,
        heroImage: String(formData.get('heroImage')),
        status: String(formData.get('status'))
      }
    });

    await tx.propertyAmenity.deleteMany({ where: { propertyId: id } });
    for (const item of amenities) {
      const amenity = await tx.amenity.upsert({
        where: { name: item.name },
        update: { icon: item.icon },
        create: { name: item.name, icon: item.icon }
      });
      await tx.propertyAmenity.create({ data: { propertyId: id, amenityId: amenity.id } });
    }

    revalidatePath('/');
    revalidatePath('/admin/properties');
    revalidatePath('/admin/calendars');
    revalidatePath(`/properties/${property.slug}`);
  });

  redirect('/admin/properties');
}

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [property, hosts] = await Promise.all([
    prisma.property.findUnique({ where: { id }, include: { bookings: true, feeds: true, amenities: { include: { amenity: true } } } }),
    prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }, orderBy: { name: 'asc' } })
  ]);
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
          <label>
            <span className="label">Property name *</span>
            <input className="input mt-1" name="name" defaultValue={property.name} required />
          </label>
          <label>
            <span className="label">URL slug *</span>
            <input className="input mt-1" name="slug" defaultValue={property.slug} required />
          </label>
          <label>
            <span className="label">Location *</span>
            <input className="input mt-1" name="location" defaultValue={property.location} required />
          </label>
          <label>
            <span className="label">Full address (optional)</span>
            <input className="input mt-1" name="address" defaultValue={property.address ?? ''} />
          </label>
          <label className="lg:col-span-2">
            <span className="label">Short tagline *</span>
            <input className="input mt-1" name="tagline" defaultValue={property.tagline} required />
          </label>
          <label className="lg:col-span-2">
            <span className="label">Description *</span>
            <textarea className="input mt-1 min-h-32" name="description" defaultValue={property.description} required />
          </label>
          <label className="lg:col-span-2">
            <span className="label">Hero image URL *</span>
            <input className="input mt-1" name="heroImage" defaultValue={property.heroImage} required />
          </label>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="label">Guests *</span>
            <input className="input mt-1" name="maxGuests" type="number" min="1" defaultValue={property.maxGuests} required />
          </label>
          <label>
            <span className="label">Bedrooms *</span>
            <input className="input mt-1" name="bedrooms" type="number" min="0" defaultValue={property.bedrooms} required />
          </label>
          <label>
            <span className="label">Bathrooms *</span>
            <input className="input mt-1" name="bathrooms" type="number" min="0" step=".5" defaultValue={property.bathrooms} required />
          </label>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="label">Nightly GBP *</span>
            <input className="input mt-1" name="baseNightlyRate" type="number" min="0" step=".01" defaultValue={property.baseNightlyRate / 100} required />
          </label>
          <label>
            <span className="label">Cleaning GBP (optional)</span>
            <input className="input mt-1" name="cleaningFee" type="number" min="0" step=".01" defaultValue={property.cleaningFee / 100} />
          </label>
          <label>
            <span className="label">Status *</span>
            <select className="input mt-1" name="status" defaultValue={property.status}>
              <option value="DRAFT">Draft</option>
              <option value="LIVE">Live</option>
            </select>
          </label>
        </section>
        <section className="grid gap-4 sm:grid-cols-3">
          <label>
            <span className="label">Minimum nights *</span>
            <input className="input mt-1" name="minNights" type="number" min="1" defaultValue={property.minNights} required />
          </label>
          <label>
            <span className="label">Weekend nightly GBP (optional)</span>
            <input className="input mt-1" name="weekendRate" type="number" min="0" step=".01" defaultValue={property.weekendRate ? property.weekendRate / 100 : ''} />
          </label>
          <label>
            <span className="label">Bank holiday nightly GBP (optional)</span>
            <input className="input mt-1" name="bankHolidayRate" type="number" min="0" step=".01" defaultValue={property.bankHolidayRate ? property.bankHolidayRate / 100 : ''} />
          </label>
          <label>
            <span className="label">Booking approval *</span>
            <select className="input mt-1" name="bookingMode" defaultValue={property.instantBook ? 'AUTO' : 'APPROVAL'}>
              <option value="AUTO">Automatically confirm bookings</option>
              <option value="APPROVAL">Require host approval</option>
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="label">Host (optional)</span>
            <select className="input mt-1" name="hostId" defaultValue={property.hostId ?? ''}>
              <option value="">No assigned host</option>
              {hosts.map(host => <option key={host.id} value={host.id}>{host.name} ({host.email})</option>)}
            </select>
          </label>
        </section>
        <section>
          <label>
            <span className="label">Amenities (optional)</span>
            <textarea className="input mt-1 min-h-24" name="amenities" defaultValue={property.amenities.map(({ amenity }) => amenity.name).join('\n')} />
          </label>
        </section>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-black/55">Current public rate: <strong>{formatMoney(property.baseNightlyRate)}</strong> per night</p>
          <button className="btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
}
