'use client';

import Link from 'next/link';
import { BarChart3, CalendarDays, ChartSpline, Home, Hotel, Inbox, LayoutDashboard, LogOut, Menu, TicketPercent, Users, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { href: '/admin', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties', Icon: Hotel },
  { href: '/admin/bookings', label: 'Bookings', Icon: Inbox },
  { href: '/admin/calendars', label: 'Calendars', Icon: CalendarDays },
  { href: '/admin/reports', label: 'Reports', Icon: ChartSpline },
  { href: '/admin/discounts', label: 'Discounts', Icon: TicketPercent },
  { href: '/admin/users', label: 'Users', Icon: Users }
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  return (
    <>
      {links.map(({ href, label, Icon }) => (
        <Link key={href} href={href} onClick={onClick} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-cream">
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
      <Link href="/" onClick={onClick} className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 transition hover:bg-cream">
        <Home className="h-4 w-4" />
        Public site
      </Link>
      <form action="/api/auth/logout" method="post">
        <button className="inline-flex w-full items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 transition hover:bg-cream" type="submit">
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </>
  );
}

export function AdminNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-black/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage text-white">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-serif text-2xl leading-none text-sage">Lets Book It</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-black/45">Admin portal</span>
          </span>
        </Link>
        <nav className="hidden flex-wrap items-center justify-end gap-2 text-sm font-semibold lg:flex">
          <NavLinks />
        </nav>
        <button className="rounded-xl border border-black/10 p-2 lg:hidden" type="button" onClick={() => setOpen(true)} aria-label="Open admin menu">
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {open ? (
        <div className="fixed inset-0 z-50 bg-black/45 lg:hidden" onClick={() => setOpen(false)}>
          <div className="ml-auto flex h-full w-full max-w-sm flex-col bg-white p-4 shadow-2xl" onClick={event => event.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div><p className="label">Admin</p><div className="font-serif text-2xl text-sage">Menu</div></div>
              <button className="rounded-xl border border-black/10 p-2" type="button" onClick={() => setOpen(false)} aria-label="Close admin menu"><X className="h-5 w-5" /></button>
            </div>
            <nav className="grid gap-2 text-sm font-semibold"><NavLinks onClick={() => setOpen(false)} /></nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
