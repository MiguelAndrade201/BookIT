import Link from 'next/link';
import { CalendarClock, CircleDollarSign, Hotel, Inbox } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { EmptyState } from '@/components/admin/EmptyState';
import { formatDateRange, statusBadgeClass } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboard() {
  const today = new Date();
  const [propertyCount, livePropertyCount, feedCount, pendingCount, bookings, upcomingBlocks] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: 'LIVE' } }),
    prisma.calendarFeed.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.findMany({
      include: { property: true, guest: true },
      orderBy: { createdAt: 'desc' },
      take: 6
    }),
    prisma.calendarBlock.findMany({
      where: { endDate: { gte: today } },
      include: { property: true },
      orderBy: { startDate: 'asc' },
      take: 5
    })
  ]);

  const bookingValue = bookings.reduce((sum, booking) => sum + booking.total, 0);
  const confirmedValue = bookings
    .filter(booking => booking.status === 'CONFIRMED')
    .reduce((sum, booking) => sum + booking.total, 0);

  const metrics = [
    { label: 'Properties', value: propertyCount, detail: `${livePropertyCount} live`, Icon: Hotel },
    { label: 'Pending bookings', value: pendingCount, detail: 'Need review', Icon: Inbox },
    { label: 'Calendar feeds', value: feedCount, detail: 'Connected channels', Icon: CalendarClock },
    { label: 'Recent value', value: formatMoney(bookingValue), detail: `${formatMoney(confirmedValue)} confirmed`, Icon: CircleDollarSign }
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Track booking requests, live properties, calendar coverage, and the work that needs attention."
        action={<Link href="/admin/properties/new" className="btn-primary">Add Property</Link>}
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, detail, Icon }) => (
          <div key={label} className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-black/55">{label}</div>
              <Icon className="h-5 w-5 text-sage" />
            </div>
            <div className="mt-4 text-3xl font-bold">{value}</div>
            <div className="mt-1 text-sm text-black/50">{detail}</div>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-3xl">Recent bookings</h2>
            <Link href="/admin/bookings" className="btn-secondary py-2">View All</Link>
          </div>
          <div className="mt-4 overflow-hidden rounded-xl border border-black/10 bg-white">
            {bookings.length ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-sand/40 text-xs uppercase tracking-wider text-black/55">
                  <tr>
                    <th className="p-4">Guest</th>
                    <th>Property</th>
                    <th>Dates</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr className="border-t border-black/10" key={booking.id}>
                      <td className="p-4">
                        <div className="font-semibold">{booking.guest.firstName} {booking.guest.lastName}</div>
                        <div className="text-black/50">{booking.guest.email}</div>
                      </td>
                      <td>{booking.property.name}</td>
                      <td>{formatDateRange(booking.checkIn, booking.checkOut)}</td>
                      <td className="font-semibold">{formatMoney(booking.total)}</td>
                      <td><span className={statusBadgeClass(booking.status)}>{booking.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-6">
                <EmptyState title="No booking requests yet">New guest requests will appear here as soon as they come in.</EmptyState>
              </div>
            )}
          </div>
        </div>

        <aside>
          <h2 className="font-serif text-3xl">Next blocked dates</h2>
          <div className="mt-4 grid gap-3">
            {upcomingBlocks.length ? upcomingBlocks.map(block => (
              <div key={block.id} className="rounded-xl border border-black/10 bg-white p-4">
                <div className="font-semibold">{block.property.name}</div>
                <div className="mt-1 text-sm text-black/60">{formatDateRange(block.startDate, block.endDate)}</div>
                <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-black/45">{block.source}</div>
              </div>
            )) : (
              <EmptyState title="No upcoming blocks">Manual and imported unavailable dates will show here.</EmptyState>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
