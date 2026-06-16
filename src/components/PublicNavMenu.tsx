'use client';

import Link from 'next/link';
import { ChevronDown, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function PublicNavMenu({ locations }: { locations: string[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
        <div className="group relative">
          <button className="inline-flex items-center gap-1 py-2" type="button">
            Locations
            <ChevronDown className="h-4 w-4" />
          </button>
          <div className="invisible absolute right-0 top-full min-w-56 rounded-xl border border-black/10 bg-white p-2 opacity-0 shadow-soft transition group-hover:visible group-hover:opacity-100">
            <Link href="/#properties" className="block rounded-lg px-3 py-2 hover:bg-cream">All locations</Link>
            {locations.map(location => (
              <Link key={location} href={`/?location=${encodeURIComponent(location)}#properties`} className="block rounded-lg px-3 py-2 hover:bg-cream">
                {location}
              </Link>
            ))}
          </div>
        </div>
        <Link href="/#reviews">Reviews</Link>
        <Link href="/login">Sign In</Link>
        <Link href="/#properties" className="btn-primary py-2.5">Book Direct</Link>
      </nav>

      <button className="rounded-xl border border-black/10 p-2 md:hidden" type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <Menu />
      </button>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 bg-black/45 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="ml-auto flex h-full w-full max-w-sm flex-col bg-white p-4 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="label">Menu</p>
                <div className="font-serif text-2xl text-sage">Book Direct</div>
              </div>
              <button className="rounded-xl border border-black/10 p-2" type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="grid gap-2 text-base font-semibold">
              <Link href="/#properties" className="rounded-xl bg-sage px-4 py-3 text-white" onClick={() => setMobileOpen(false)}>Book Direct</Link>
              <Link href="/#reviews" className="rounded-xl px-4 py-3 hover:bg-cream" onClick={() => setMobileOpen(false)}>Reviews</Link>
              <Link href="/login" className="rounded-xl px-4 py-3 hover:bg-cream" onClick={() => setMobileOpen(false)}>Sign In</Link>
              <div className="mt-2 rounded-xl border border-black/10 p-2">
                <div className="px-2 py-2 text-xs font-bold uppercase tracking-wider text-black/45">Locations</div>
                <Link href="/#properties" className="block rounded-lg px-3 py-2 hover:bg-cream" onClick={() => setMobileOpen(false)}>All locations</Link>
                {locations.map(location => (
                  <Link key={location} href={`/?location=${encodeURIComponent(location)}#properties`} className="block rounded-lg px-3 py-2 hover:bg-cream" onClick={() => setMobileOpen(false)}>
                    {location}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
