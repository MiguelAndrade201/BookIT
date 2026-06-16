import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ADMIN_SESSION_COOKIE, hashPassword, parseSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function createUser(formData: FormData) {
  'use server';
  const session = await parseSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (session?.role !== 'SUPER_ADMIN') redirect('/admin');

  await prisma.user.create({
    data: {
      name: String(formData.get('name')),
      email: String(formData.get('email')),
      role: String(formData.get('role')),
      passwordHash: await hashPassword(String(formData.get('password')))
    }
  });
  redirect('/admin/users');
}

export default async function UsersPage() {
  const session = await parseSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (session?.role !== 'SUPER_ADMIN') redirect('/admin');
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  const envAdmin = {
    id: 'env-super-admin',
    name: process.env.ADMIN_USERNAME ?? 'Miguel',
    email: process.env.ADMIN_EMAIL ?? 'Environment Super Admin',
    role: 'SUPER_ADMIN',
    createdAt: null as Date | null,
    lastLoginAt: null as Date | null
  };
  const rows = users.some(user => user.name === envAdmin.name || user.email === envAdmin.email) ? users : [envAdmin, ...users];

  return (
    <div>
      <AdminPageHeader eyebrow="Access" title="Users" description="Create Super Admin, Admin, and Customer accounts." />
      <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action={createUser} className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Add user</h2>
          <input className="input" name="name" placeholder="Name" required />
          <input className="input" type="email" name="email" placeholder="Email" required />
          <input className="input" type="password" name="password" placeholder="Password" minLength={8} required />
          <select className="input" name="role" defaultValue="CUSTOMER">
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="CUSTOMER">Customer</option>
          </select>
          <button className="btn-primary">Create User</button>
        </form>
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/40 text-xs uppercase tracking-wider text-black/55"><tr><th className="p-4">User</th><th>Role</th><th>Last login</th><th>Created</th></tr></thead>
            <tbody>
              {rows.map(user => (
                <tr key={user.id} className="border-t border-black/10">
                  <td className="p-4"><div className="font-semibold">{user.name}</div><div className="text-black/50">{user.email}</div></td>
                  <td>{user.role}</td>
                  <td>{user.lastLoginAt ? user.lastLoginAt.toLocaleString() : user.id === 'env-super-admin' ? 'Environment login' : 'Never'}</td>
                  <td>{user.createdAt ? user.createdAt.toLocaleDateString() : 'Environment'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
