import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import { ADMIN_SESSION_COOKIE, createSessionToken, hashPassword, legacyAdminSessionToken, parseSessionToken, verifyPassword } from '@/lib/auth';
import { Logo } from '@/components/Logo';
import { prisma } from '@/lib/prisma';

function safeNext(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin';
  return value;
}

async function login(formData: FormData) {
  'use server';

  const username = String(formData.get('username') || '');
  const password = String(formData.get('password') || '');
  const next = safeNext(String(formData.get('next') || '/admin'));
  const adminUsername = process.env.ADMIN_USERNAME ?? process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'change-this-password';
  const user = await prisma.user.findFirst({ where: { OR: [{ email: username }, { name: username }] } });

  let token: string | null = null;

  if (user && await verifyPassword(password, user.passwordHash)) {
    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    token = await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role });
  } else if (username === adminUsername && password === adminPassword) {
    token = await createSessionToken({ id: 'env-super-admin', name: adminUsername, email: process.env.ADMIN_EMAIL ?? 'admin@example.com', role: 'SUPER_ADMIN' });
  }

  if (!token) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect(next);
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const cookieStore = await cookies();
  if (await parseSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value) || cookieStore.get(ADMIN_SESSION_COOKIE)?.value === await legacyAdminSessionToken()) redirect(next);

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-black/10 bg-cream">
        <div className="mx-auto flex max-w-md items-center justify-center px-4 py-4">
          <Link href="/"><Logo /></Link>
        </div>
      </header>
      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-md items-center px-4 py-8 sm:py-12">
        <form action={login} className="card w-full p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sage text-white">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="label">Account</p>
              <h1 className="font-serif text-3xl">Sign In</h1>
            </div>
          </div>
          <input type="hidden" name="next" value={next} />
          <div className="grid gap-4">
            <label>
              <span className="label">Username</span>
              <input className="input mt-1" type="text" name="username" autoComplete="username" required />
            </label>
            <label>
              <span className="label">Password</span>
              <input className="input mt-1" type="password" name="password" autoComplete="current-password" required />
            </label>
            {sp.error ? <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Username or password is incorrect.</div> : null}
            <button className="btn-primary" type="submit">Sign In</button>
            <a className="btn-secondary text-center" href="/register">Register User</a>
          </div>
        </form>
      </section>
    </main>
  );
}
