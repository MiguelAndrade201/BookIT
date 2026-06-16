import Link from 'next/link';
import { Logo } from './Logo';
import { prisma } from '@/lib/prisma';
import { PublicNavMenu } from './PublicNavMenu';

export async function PublicNav() {
  const locations = await prisma.property.findMany({
    where: { status: 'LIVE' },
    distinct: ['location'],
    orderBy: { location: 'asc' },
    select: { location: true }
  });

  return (
    <header className="sticky top-0 z-[100] border-b border-black/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link href="/"><Logo /></Link>
        <PublicNavMenu locations={locations.map(({ location }) => location)} />
      </div>
    </header>
  );
}
