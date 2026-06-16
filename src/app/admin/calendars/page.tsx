import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarSync, ChevronLeft, ChevronRight, Lock, Trash2, Unlock } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { DayPricingEditor } from '@/components/admin/DayPricingEditor';
import { EmptyState } from '@/components/admin/EmptyState';
import { prisma } from '@/lib/prisma';
import { dollarsToCents } from '@/lib/admin';
import { formatMoney } from '@/lib/money';

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getMonthFromParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}$/.test(value)) return new Date();
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, 1);
}

function buildCalendarDays(month: Date) {
  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
  const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const leadingDays = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -leadingDays);
  const days = [];

  for (let index = 0; index < 42; index++) {
    const date = addDays(gridStart, index);
    days.push({
      date,
      key: dateKey(date),
      isCurrentMonth: date.getMonth() === month.getMonth()
    });
  }

  return { days, monthStart, monthEndExclusive: addDays(monthEnd, 1) };
}

function monthHref(propertyId: string, month: Date, mode = 'availability') {
  return `/admin/calendars?propertyId=${propertyId}&month=${monthKey(month)}&mode=${mode}`;
}

async function addFeed(formData: FormData) {
  'use server';
  await prisma.calendarFeed.create({
    data: {
      propertyId: String(formData.get('propertyId')),
      name: String(formData.get('name')),
      source: String(formData.get('source')),
      feedUrl: String(formData.get('feedUrl'))
    }
  });
  redirect(`/admin/calendars?propertyId=${formData.get('propertyId')}`);
}

async function deleteFeed(formData: FormData) {
  'use server';
  const propertyId = String(formData.get('propertyId'));
  await prisma.calendarFeed.delete({ where: { id: String(formData.get('id')) } });
  redirect(`/admin/calendars?propertyId=${propertyId}`);
}

async function toggleDay(formData: FormData) {
  'use server';
  const propertyId = String(formData.get('propertyId'));
  const selectedMonth = String(formData.get('month'));
  const day = parseDateKey(String(formData.get('date')));
  const nextDay = addDays(day, 1);

  const existingBlocks = await prisma.calendarBlock.findMany({
    where: {
      propertyId,
      startDate: { lt: nextDay },
      endDate: { gt: day }
    },
    select: { id: true }
  });

  if (existingBlocks.length) {
    await prisma.calendarBlock.deleteMany({ where: { id: { in: existingBlocks.map(block => block.id) } } });
  } else {
    await prisma.calendarBlock.create({
      data: {
        propertyId,
        source: 'MANUAL',
        startDate: day,
        endDate: nextDay,
        title: 'Admin block',
        notes: 'Blocked from the admin monthly calendar'
      }
    });
  }

  redirect(`/admin/calendars?propertyId=${propertyId}&month=${selectedMonth}`);
}

async function setDayPrice(formData: FormData) {
  'use server';
  const propertyId = String(formData.get('propertyId'));
  const selectedMonth = String(formData.get('month'));
  const day = parseDateKey(String(formData.get('date')));
  const price = dollarsToCents(formData.get('price'));

  if (price > 0) {
    await prisma.dayPricing.upsert({
      where: { propertyId_date: { propertyId, date: day } },
      update: { price },
      create: { propertyId, date: day, price }
    });
  }

  redirect(`/admin/calendars?propertyId=${propertyId}&month=${selectedMonth}&mode=pricing`);
}

async function syncFeeds() {
  'use server';
  const { syncAllFeeds } = await import('@/lib/ical');
  await syncAllFeeds();
  redirect('/admin/calendars');
}

export default async function CalendarsPage({
  searchParams
}: {
  searchParams?: Promise<{ propertyId?: string; month?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const properties = await prisma.property.findMany({ orderBy: { name: 'asc' } });
  const selectedProperty = properties.find(property => property.id === params?.propertyId) ?? properties[0];
  const selectedMonth = getMonthFromParam(params?.month);
  const mode = params?.mode === 'pricing' ? 'pricing' : 'availability';
  const { days, monthStart, monthEndExclusive } = buildCalendarDays(selectedMonth);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const [feeds, blocks, bookings, dayPricings] = selectedProperty ? await Promise.all([
    prisma.calendarFeed.findMany({
      where: { propertyId: selectedProperty.id },
      include: { property: true },
      orderBy: { name: 'asc' }
    }),
    prisma.calendarBlock.findMany({
      where: {
        propertyId: selectedProperty.id,
        startDate: { lt: monthEndExclusive },
        endDate: { gt: monthStart }
      },
      orderBy: { startDate: 'asc' }
    }),
    prisma.booking.findMany({
      where: {
        propertyId: selectedProperty.id,
        status: { in: ['PENDING', 'CONFIRMED'] },
        checkIn: { lt: monthEndExclusive },
        checkOut: { gt: monthStart }
      },
      include: { guest: true },
      orderBy: { checkIn: 'asc' }
    }),
    prisma.dayPricing.findMany({
      where: {
        propertyId: selectedProperty.id,
        date: { gte: monthStart, lt: monthEndExclusive }
      }
    })
  ]) : [[], [], [], []];

  const previousMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1, 1);
  const nextMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 1);
  const selectedMonthKey = monthKey(selectedMonth);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Availability"
        title="Calendar"
        description="Select a property, then click a day to block it or make it available again."
        action={
          <form action={syncFeeds}>
            <button className="btn-primary inline-flex items-center gap-2"><CalendarSync className="h-4 w-4" /> Sync Feeds</button>
          </form>
        }
      />

      {!selectedProperty ? (
        <div className="mt-6">
          <EmptyState title="No properties yet">Create a property before managing availability.</EmptyState>
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-xl border border-black/10 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2 rounded-xl bg-cream p-2">
                {properties.map(property => {
                  const isActive = property.id === selectedProperty.id;
                  return (
                    <Link
                      key={property.id}
                      href={monthHref(property.id, selectedMonth, mode)}
                      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-sage text-white shadow-sm'
                          : 'bg-white text-black/65 ring-1 ring-black/10 hover:bg-sand/50'
                      }`}
                    >
                      {property.name}
                    </Link>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-3 lg:justify-end">
                <Link className="rounded-xl border border-black/10 p-3 hover:bg-cream" href={monthHref(selectedProperty.id, previousMonth, mode)} aria-label="Previous month">
                  <ChevronLeft className="h-4 w-4" />
                </Link>
                <h2 className="min-w-48 text-center font-serif text-3xl">
                  {selectedMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
                </h2>
                <Link className="rounded-xl border border-black/10 p-3 hover:bg-cream" href={monthHref(selectedProperty.id, nextMonth, mode)} aria-label="Next month">
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-semibold text-black/55">{selectedProperty.name}</div>
                <Link className={mode === 'pricing' ? 'btn-primary py-2' : 'btn-secondary py-2'} href={`/admin/calendars?propertyId=${selectedProperty.id}&month=${selectedMonthKey}&mode=${mode === 'pricing' ? 'availability' : 'pricing'}`}>
                  {mode === 'pricing' ? 'Done Editing Pricing' : 'Edit Pricing'}
                </Link>
              </div>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-xl border border-black/10 bg-black/10">
              {dayLabels.map(label => (
                <div key={label} className="bg-sand/50 px-2 py-3 text-center text-xs font-bold uppercase tracking-wider text-black/55">{label}</div>
              ))}
              {days.map(day => {
                const dayStart = day.date;
                const dayEnd = addDays(dayStart, 1);
                const dayBlocks = blocks.filter(block => block.startDate < dayEnd && block.endDate > dayStart);
                const dayBookings = bookings.filter(booking => booking.checkIn < dayEnd && booking.checkOut > dayStart);
                const isBooked = dayBookings.length > 0;
                const isBlocked = dayBlocks.length > 0;
                const isUnavailable = isBooked || isBlocked;
                const unavailableLabel = isBooked ? 'Reserved' : 'Blocked';
                const dayPricing = dayPricings.find(item => item.date.getTime() === dayStart.getTime());
                const sourceLabel = isBooked
                  ? dayBookings.map(booking => `${booking.guest.firstName} ${booking.guest.lastName}`).join(', ')
                  : dayBlocks.map(block => block.source).join(', ');

                return (
                  <div key={day.key} className={`min-h-28 bg-white p-2 ${day.isCurrentMonth ? '' : 'text-black/30'}`}>
                    {mode === 'pricing' ? (
                      <DayPricingEditor
                        action={setDayPrice}
                        date={day.key}
                        day={day.date.getDate()}
                        month={selectedMonthKey}
                        price={formatMoney(dayPricing?.price ?? selectedProperty.baseNightlyRate)}
                        propertyId={selectedProperty.id}
                      />
                    ) : (
                    <form action={toggleDay} className="h-full">
                      <input type="hidden" name="propertyId" value={selectedProperty.id} />
                      <input type="hidden" name="month" value={selectedMonthKey} />
                      <input type="hidden" name="date" value={day.key} />
                      <button
                        className={`flex h-full min-h-24 w-full flex-col rounded-lg border p-2 text-left transition ${
                          isUnavailable
                            ? 'border-red-200 bg-red-50 text-red-900 hover:bg-red-100'
                            : 'border-transparent bg-white hover:border-green-200 hover:bg-green-50'
                        }`}
                        disabled={isBooked}
                        title={isBooked ? 'Direct bookings cannot be made available here' : isBlocked ? 'Make available' : 'Block this day'}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold">{day.date.getDate()}</span>
                          {isUnavailable ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4 text-green-700" />}
                        </span>
                        <span className="mt-auto pt-4 text-xs font-semibold">
                          {isUnavailable ? unavailableLabel : 'Available'}
                        </span>
                        {sourceLabel ? <span className="mt-1 truncate text-[11px] opacity-70">{sourceLabel}</span> : null}
                      </button>
                    </form>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-black/55">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-white ring-1 ring-black/15" /> Available</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-50 ring-1 ring-red-200" /> Blocked</span>
              <span className="inline-flex items-center gap-2"><Lock className="h-3 w-3 text-red-800" /> Reserved days cannot be toggled</span>
            </div>
          </section>

          <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
              <h2 className="font-serif text-2xl">Connected iCal feeds</h2>
              <form action={addFeed} className="mt-4 grid gap-3">
                <input type="hidden" name="propertyId" value={selectedProperty.id} />
                <select name="source" className="input" defaultValue="AIRBNB">
                  <option value="AIRBNB">Airbnb</option>
                  <option value="BOOKING_COM">Booking.com</option>
                  <option value="VRBO">VRBO</option>
                  <option value="OTHER">Other</option>
                </select>
                <input name="name" className="input" placeholder="Feed name" required />
                <input name="feedUrl" className="input" placeholder="https://...ics" required />
                <button className="btn-primary">Add Feed</button>
              </form>

              <div className="mt-5 grid gap-3">
                {feeds.length ? feeds.map(feed => (
                  <div key={feed.id} className="rounded-xl border border-black/10 bg-cream/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold">{feed.name}</div>
                        <div className="text-sm text-black/60">{feed.source}</div>
                        <div className="mt-2 truncate text-xs text-black/50">{feed.feedUrl}</div>
                        <div className="mt-1 text-xs text-black/50">Last synced: {feed.lastSyncedAt?.toLocaleString() ?? 'Never'}</div>
                      </div>
                      <form action={deleteFeed}>
                        <input type="hidden" name="id" value={feed.id} />
                        <input type="hidden" name="propertyId" value={selectedProperty.id} />
                        <button className="rounded-xl border border-black/10 bg-white p-2 text-red-700 hover:bg-red-50" title="Delete feed" aria-label="Delete feed">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </div>
                  </div>
                )) : <EmptyState title="No feeds connected">Add external iCal feeds for this property.</EmptyState>}
              </div>
            </div>

            <aside className="rounded-xl border border-black/10 bg-white p-5 shadow-soft">
              <h2 className="font-serif text-2xl">Outbound feed</h2>
              <p className="mt-2 text-sm text-black/60">Use this URL in external channels to block direct bookings there.</p>
              <div className="mt-4 break-all rounded-lg bg-cream px-3 py-2 font-mono text-xs text-black/70">
                {siteUrl}/api/properties/{selectedProperty.slug}/ical
              </div>
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-black/50">Month summary</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-cream p-3">
                  <div className="text-black/50">Blocks</div>
                  <div className="text-2xl font-bold">{blocks.length}</div>
                </div>
                <div className="rounded-lg bg-cream p-3">
                  <div className="text-black/50">Bookings</div>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                </div>
              </div>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
