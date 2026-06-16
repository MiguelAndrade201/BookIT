import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidAdminSession, legacyAdminSessionToken } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin') || req.nextUrl.pathname.startsWith('/api/admin');
  if (!isAdminRoute) return NextResponse.next();

  const sessionCookie = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await isValidAdminSession(sessionCookie) || sessionCookie === await legacyAdminSessionToken()) {
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith('/api/admin')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const loginUrl = new URL('/login', req.url);
  loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
