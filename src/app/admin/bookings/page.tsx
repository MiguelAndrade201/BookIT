import { Check, X } from 'lucide-react';
import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { BookingsCalendar } from '@/components/admin/BookingsCalendar';
import { CopyLinkButton } from '@/components/admin/CopyLinkButton';
import { EmptyState } from '@/components/admin/EmptyState';
import { dollarsToCents, formatDateRange, statusBadgeClass } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';

async function updateBookingStatus(formData: FormData) {
  'use server';
  await prisma.booking.update({ where: { id: String(formData.get('id')) }, data: { status: String(formData.get('status')) } });
}

async function createCustomBooking(formData: FormData) {
  'use server';
  await prisma.customBookingLink.create({
    data: {
      propertyId: String(formData.get('propertyId')),
      token: crypto.randomUUID(),
      checkIn: new Date(`${formData.get('checkIn')}T00:00:00`),
      checkOut: new Date(`${formData.get('checkOut')}T00:00:00`),
      guests: Number(formData.get('guests') || 1),
      total: dollarsToCents(formData.get('total')),
      guestEmail: String(formData.get('guestEmail') || '') || null,
      emailOnCreate: formData.get('emailOnCreate') === 'on',
      notes: String(formData.get('notes') || '') || null
    }
  });
}

export default async function AdminBookings() {
  const bookings = await prisma.booking.findMany({ include: { property: true, guest: true }, orderBy: { createdAt: 'desc' } });
  const [properties, customLinks] = await Promise.all([
    prisma.property.findMany({ orderBy: { name: 'asc' } }),
    prisma.customBookingLink.findMany({ include: { property: true }, orderBy: { createdAt: 'desc' }, take: 8 })
  ]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const totals = {
    pending: bookings.filter(booking => booking.status === 'PENDING').length,
    confirmed: bookings.filter(booking => booking.status === 'CONFIRMED').length,
    cancelled: bookings.filter(booking => booking.status === 'CANCELLED').length,
    value: bookings.filter(booking => booking.status !== 'CANCELLED').reduce((sum, booking) => sum + booking.total, 0)
  };

  return (
    <div>
      <AdminPageHeader eyebrow="Guest requests" title="Bookings" description="Review reservation requests, calendar occupancy, and custom booking links." />
      <section className="mt-6 grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Pending</div><div className="mt-2 text-3xl font-bold">{totals.pending}</div></div>
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Confirmed</div><div className="mt-2 text-3xl font-bold">{totals.confirmed}</div></div>
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Cancelled</div><div className="mt-2 text-3xl font-bold">{totals.cancelled}</div></div>
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Active value</div><div className="mt-2 text-3xl font-bold">{formatMoney(totals.value)}</div></div>
      </section>

      <BookingsCalendar bookings={bookings.map(booking => ({
        id: booking.id,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
        initials: `${booking.guest.firstName[0] ?? ''}${booking.guest.lastName[0] ?? ''}`,
        email: booking.guest.email,
        phone: booking.guest.phone,
        property: booking.property.name,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        total: formatMoney(booking.total),
        status: booking.status
      }))} />

      <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action={createCustomBooking} className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Custom booking link</h2>
          <label><span className="label">Property</span><select className="input mt-1" name="propertyId" required>{properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select></label>
          <div className="grid gap-3 sm:grid-cols-2"><label><span className="label">Check-in</span><input className="input mt-1" name="checkIn" type="date" required /></label><label><span className="label">Check-out</span><input className="input mt-1" name="checkOut" type="date" required /></label></div>
          <label><span className="label">Guests</span><input className="input mt-1" name="guests" type="number" min="1" required /></label>
          <label><span className="label">Custom price GBP</span><input className="input mt-1" name="total" type="number" min="0" step=".01" required /></label>
          <label><span className="label">Customer email optional</span><input className="input mt-1" name="guestEmail" type="email" /></label>
          <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold"><input type="checkbox" name="emailOnCreate" className="h-4 w-4" />Show email action for this link</label>
          <label><span className="label">Notes</span><textarea className="input mt-1" name="notes" /></label>
          <button className="btn-primary">Create Link</button>
        </form>
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Recent custom links</h2>
          <div className="mt-4 grid gap-3">
            {customLinks.map(link => {
              const url = `${siteUrl}/custom-booking/${link.token}`;
              return (
                <div key={link.id} className="rounded-xl bg-cream p-3 text-sm">
                  <div className="font-semibold">{link.property.name} - {formatMoney(link.total)}</div>
                  <div className="mt-1 break-all text-black/60">{url}</div>
                  <div className="mt-2 flex gap-2">
                    <CopyLinkButton value={url} />
                    {link.emailOnCreate && link.guestEmail ? <Link className="btn-secondary py-2" href={`mailto:${link.guestEmail}?subject=Your booking link&body=${encodeURIComponent(url)}`}>Email</Link> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="mt-6 overflow-hidden rounded-xl border border-black/10 bg-white">
        {bookings.length ? (
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/40 text-xs uppercase tracking-wider text-black/55"><tr><th className="p-4">Guest</th><th>Property</th><th>Dates</th><th>Guests</th><th>Total</th><th>Status</th><th className="pr-4 text-right">Actions</th></tr></thead>
            <tbody>
              {bookings.map(booking => (
                <tr className="border-t border-black/10 align-top" key={booking.id}>
                  <td className="p-4"><div className="font-semibold">{booking.guest.firstName} {booking.guest.lastName}</div><div className="text-black/50">{booking.guest.email}</div>{booking.guest.phone ? <div className="text-black/50">{booking.guest.phone}</div> : null}{booking.notes ? <div className="mt-2 max-w-xs text-xs text-black/55">{booking.notes}</div> : null}</td>
                  <td>{booking.property.name}</td>
                  <td>{formatDateRange(booking.checkIn, booking.checkOut)}<div className="text-xs text-black/50">{booking.nights} nights</div></td>
                  <td>{booking.guests}</td>
                  <td className="font-semibold">{formatMoney(booking.total)}</td>
                  <td><span className={statusBadgeClass(booking.status)}>{booking.status}</span></td>
                  <td className="pr-4"><div className="flex justify-end gap-2"><form action={updateBookingStatus}><input type="hidden" name="id" value={booking.id} /><input type="hidden" name="status" value="CONFIRMED" /><button className="rounded-xl border border-black/10 bg-white p-2 text-green-700 hover:bg-green-50" title="Confirm booking" aria-label="Confirm booking"><Check className="h-4 w-4" /></button></form><form action={updateBookingStatus}><input type="hidden" name="id" value={booking.id} /><input type="hidden" name="status" value="CANCELLED" /><button className="rounded-xl border border-black/10 bg-white p-2 text-red-700 hover:bg-red-50" title="Cancel booking" aria-label="Cancel booking"><X className="h-4 w-4" /></button></form></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <div className="p-6"><EmptyState title="No bookings yet">Guest reservation requests will appear here.</EmptyState></div>}
      </div>
    </div>
  );
}
