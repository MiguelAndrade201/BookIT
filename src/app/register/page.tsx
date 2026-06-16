import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import { PublicNav } from '@/components/PublicNav';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, createSessionToken, hashPassword, parseSessionToken } from '@/lib/auth';

async function register(formData: FormData) {
  'use server';

  const existingUsers = await prisma.user.count();
  const session = await parseSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  const canCreatePrivilegedUser = existingUsers === 0 || session?.role === 'SUPER_ADMIN';
  if (!canCreatePrivilegedUser) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const role = existingUsers === 0 ? 'SUPER_ADMIN' : String(formData.get('role') || 'CUSTOMER');

  if (!name || !email || password.length < 8) redirect('/register?error=1');

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await hashPassword(password)
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, await createSessionToken({ id: user.id, name: user.name, email: user.email, role: user.role }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect(['SUPER_ADMIN', 'ADMIN'].includes(user.role) ? '/admin' : '/');
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const existingUsers = await prisma.user.count();
  const session = await parseSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  const canPickRole = existingUsers === 0 || session?.role === 'SUPER_ADMIN';

  return (
    <main className="min-h-screen bg-cream">
      <PublicNav />
      <section className="mx-auto flex min-h-[calc(100vh-88px)] max-w-md items-center px-4 py-12">
        <form action={register} className="card w-full p-6">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sage text-white"><UserPlus className="h-5 w-5" /></span>
            <div><p className="label">Account</p><h1 className="font-serif text-3xl">Register User</h1></div>
          </div>
          <div className="grid gap-4">
            <input className="input" name="name" placeholder="Name" required />
            <input className="input" type="email" name="email" placeholder="Email" required />
            <input className="input" type="password" name="password" placeholder="Password" minLength={8} required />
            {canPickRole ? (
              <select className="input" name="role" defaultValue={existingUsers === 0 ? 'SUPER_ADMIN' : 'CUSTOMER'}>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="CUSTOMER">Customer</option>
              </select>
            ) : null}
            {sp.error ? <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">Please enter a valid user and password of at least 8 characters.</div> : null}
            <button className="btn-primary" type="submit">Register</button>
          </div>
        </form>
      </section>
    </main>
  );
}
