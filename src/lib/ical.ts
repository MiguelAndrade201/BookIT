import ICAL from 'ical.js';
import { prisma } from './prisma';

const Ical = ICAL as any;

function asDate(value: { toJSDate: () => Date }) {
  return value.toJSDate();
}

export async function importIcalFeed(feedId: string) {
  const feed = await prisma.calendarFeed.findUnique({ where: { id: feedId } });
  if (!feed || !feed.syncEnabled) return { imported: 0 };

  const response = await fetch(feed.feedUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Failed to fetch iCal feed ${feed.name}: ${response.status}`);
  const icsText = await response.text();
  const jcal = Ical.parse(icsText);
  const component = new Ical.Component(jcal);
  const events = component.getAllSubcomponents('vevent');

  await prisma.calendarBlock.deleteMany({
    where: { propertyId: feed.propertyId, source: feed.source, sourceEventId: { not: null } }
  });

  let imported = 0;
  for (const vevent of events) {
    const event = new Ical.Event(vevent);
    if (!event.startDate || !event.endDate) continue;
    const sourceEventId = event.uid || `${feed.id}-${imported}`;
    await prisma.calendarBlock.create({
      data: {
        propertyId: feed.propertyId,
        source: feed.source,
        sourceEventId,
        startDate: asDate(event.startDate),
        endDate: asDate(event.endDate),
        title: event.summary || `${feed.source} blocked`,
        notes: `Imported from ${feed.name}`
      }
    });
    imported++;
  }

  await prisma.calendarFeed.update({ where: { id: feed.id }, data: { lastSyncedAt: new Date() } });
  return { imported };
}

export async function syncAllFeeds() {
  const feeds = await prisma.calendarFeed.findMany({ where: { syncEnabled: true } });
  const results = [];
  for (const feed of feeds) {
    try {
      results.push({ feedId: feed.id, name: feed.name, ...(await importIcalFeed(feed.id)) });
    } catch (error) {
      results.push({ feedId: feed.id, name: feed.name, error: error instanceof Error ? error.message : String(error) });
    }
  }
  return results;
}
