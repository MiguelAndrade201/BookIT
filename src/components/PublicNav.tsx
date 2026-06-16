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
    <>
      <header className="fixed inset-x-0 top-0 z-[9999] border-b border-black/10 bg-cream shadow-sm">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Link href="/"><Logo /></Link>
          <PublicNavMenu locations={locations.map(({ location }) => location)} />
        </div>
      </header>
      <div className="h-20" aria-hidden="true" />
    </>
  );
}
