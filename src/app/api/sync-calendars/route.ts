import { NextResponse } from 'next/server';
import { syncAllFeeds } from '@/lib/ical';

export async function POST() {
  const results = await syncAllFeeds();
  return NextResponse.json({ results });
}
