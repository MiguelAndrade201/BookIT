import Link from 'next/link';
import path from 'path';
import { rm } from 'fs/promises';
import { Eye, Pencil, Plus, Power } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { statusBadgeClass } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';
import { DeletePropertyButton } from './DeletePropertyButton';

async function togglePropertyStatus(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const status = String(formData.get('status')) === 'LIVE' ? 'DRAFT' : 'LIVE';
  await prisma.property.update({ where: { id }, data: { status } });
}

async function deleteProperty(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  const property = await prisma.property.delete({ where: { id } });

  await rm(path.join(process.cwd(), 'uploads', 'properties', property.slug), {
    recursive: true,
    force: true
  }).catch(() => undefined);
}

export default async function AdminProperties() {
  const properties = await prisma.property.findMany({
    include: { bookings: true, feeds: true, images: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Inventory"
        title="Properties"
        description="Manage listing details, pricing, visibility, and channel calendar coverage."
        action={<Link href="/admin/properties/new" className="btn-primary inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Add Property</Link>}
      />

      <div className="mt-6 grid gap-4">
        {properties.length ? properties.map(property => (
          <article key={property.id} className="rounded-xl border border-black/10 bg-white p-4 shadow-soft">
            <div className="grid gap-4 lg:grid-cols-[220px_1fr_auto] lg:items-center">
              <img src={property.heroImage} className="h-40 w-full rounded-lg object-cover lg:h-32" alt="" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif text-2xl">{property.name}</h2>
                  <span className={statusBadgeClass(property.status)}>{property.status}</span>
                </div>
                <p className="mt-1 text-sm text-black/60">{property.location} · Sleeps {property.maxGuests} · {property.bedrooms} bedrooms · {property.bathrooms} baths</p>
                <p className="mt-2 line-clamp-2 text-sm text-black/65">{property.tagline}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-black/50">
                  <span>{formatMoney(property.baseNightlyRate)}/night</span>
                  <span>{property.bookings.length} bookings</span>
                  <span>{property.feeds.length} feeds</span>
                  <span>{property.images.length} gallery images</span>
                  <span>/{property.slug}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Link className="btn-secondary inline-flex items-center gap-2 py-2" href={`/properties/${property.slug}`}><Eye className="h-4 w-4" /> View</Link>
                <Link className="btn-secondary inline-flex items-center gap-2 py-2" href={`/admin/properties/${property.id}`}><Pencil className="h-4 w-4" /> Edit</Link>
                <form action={togglePropertyStatus}>
                  <input type="hidden" name="id" value={property.id} />
                  <input type="hidden" name="status" value={property.status} />
                  <button className="btn-secondary inline-flex items-center gap-2 py-2"><Power className="h-4 w-4" /> {property.status === 'LIVE' ? 'Draft' : 'Publish'}</button>
                </form>
                <form action={deleteProperty}>
                  <input type="hidden" name="id" value={property.id} />
                  <DeletePropertyButton propertyName={property.name} />
                </form>
              </div>
            </div>
          </article>
        )) : (
          <EmptyState title="No properties yet">
            <Link href="/admin/properties/new" className="mt-4 inline-flex btn-primary">Create your first listing</Link>
          </EmptyState>
        )}
      </div>
    </div>
  );
}
