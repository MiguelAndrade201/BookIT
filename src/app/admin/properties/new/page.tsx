import Link from 'next/link';
import { cookies } from 'next/headers';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { ADMIN_SESSION_COOKIE, parseSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NewPropertyForm } from './NewPropertyForm';

export default async function NewPropertyPage() {
  const session = await parseSessionToken((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  const hosts = session?.role === 'SUPER_ADMIN'
    ? await prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }, orderBy: { name: 'asc' } })
    : await prisma.user.findMany({ where: { id: session?.id, role: { in: ['SUPER_ADMIN', 'ADMIN'] } }, orderBy: { name: 'asc' } });
  const hostOptions = hosts.map(host => ({ id: host.id, name: host.name, email: host.email }));
  const hasSessionHost = hostOptions.some(host => host.id === session?.id);
  if (session?.role === 'SUPER_ADMIN' && session.id === 'env-super-admin' && !hasSessionHost) {
    hostOptions.unshift({
      id: 'env-super-admin',
      name: session.name || 'Environment admin',
      email: `${session.email} (environment login)`
    });
  }

  return (
    <div>
      <AdminPageHeader
        eyebrow="Inventory"
        title="Add property"
        description="Create the listing, upload images, drag them into order, and use the first image as the hero."
        action={<Link href="/admin/properties" className="btn-secondary">Back</Link>}
      />
      <NewPropertyForm hosts={hostOptions} isSuperAdmin={session?.role === 'SUPER_ADMIN'} />
    </div>
  );
}
