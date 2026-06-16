import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';

const periods = [
  ['week', 'Weekly', 7],
  ['month', 'Monthly', 30],
  ['3m', '3 months', 90],
  ['6m', '6 months', 180],
  ['1y', '1 year', 365]
] as const;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const sp = await searchParams;
  const selected = periods.find(([key]) => key === sp.period) ?? periods[1];
  const from = addDays(new Date(), -selected[2]);
  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: from }, status: { not: 'CANCELLED' } },
    include: { property: true },
    orderBy: { createdAt: 'asc' }
  });
  const revenue = bookings.reduce((sum, booking) => sum + booking.total, 0);
  const nights = bookings.reduce((sum, booking) => sum + booking.nights, 0);
  const byMonth = new Map<string, number>();
  const byProperty = new Map<string, number>();
  bookings.forEach(booking => {
    const month = booking.checkIn.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1);
    byProperty.set(booking.property.name, (byProperty.get(booking.property.name) ?? 0) + 1);
  });
  const busiestMonth = Array.from(byMonth.entries()).sort((a, b) => b[1] - a[1])[0];
  const busiestProperty = Array.from(byProperty.entries()).sort((a, b) => b[1] - a[1])[0];

  return (
    <div>
      <AdminPageHeader eyebrow="Insights" title="Reports" description="Review booking performance and spot busy periods." />
      <div className="mt-6 flex flex-wrap gap-2">
        {periods.map(([key, label]) => <Link key={key} className={selected[0] === key ? 'btn-primary py-2' : 'btn-secondary py-2'} href={`/admin/reports?period=${key}`}>{label}</Link>)}
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Bookings</div><div className="mt-2 text-3xl font-bold">{bookings.length}</div></div>
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Revenue</div><div className="mt-2 text-3xl font-bold">{formatMoney(revenue)}</div></div>
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Nights</div><div className="mt-2 text-3xl font-bold">{nights}</div></div>
        <div className="rounded-xl border border-black/10 bg-white p-4"><div className="text-sm text-black/55">Avg booking</div><div className="mt-2 text-3xl font-bold">{formatMoney(bookings.length ? Math.round(revenue / bookings.length) : 0)}</div></div>
      </section>
      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Busy-period insights</h2>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-xl bg-cream p-4"><strong>Busiest month:</strong> {busiestMonth ? `${busiestMonth[0]} (${busiestMonth[1]} bookings)` : 'Not enough data yet'}</div>
            <div className="rounded-xl bg-cream p-4"><strong>Most booked property:</strong> {busiestProperty ? `${busiestProperty[0]} (${busiestProperty[1]} bookings)` : 'Not enough data yet'}</div>
          </div>
        </div>
        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Recent bookings</h2>
          <div className="mt-4 grid gap-2 text-sm">
            {bookings.slice(-8).reverse().map(booking => <div key={booking.id} className="flex justify-between rounded-xl bg-cream p-3"><span>{booking.property.name}</span><strong>{formatMoney(booking.total)}</strong></div>)}
          </div>
        </div>
      </section>
    </div>
  );
}
