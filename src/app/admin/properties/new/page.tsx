import Link from 'next/link';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { prisma } from '@/lib/prisma';
import { NewPropertyForm } from './NewPropertyForm';

export default async function NewPropertyPage() {
  const hosts = await prisma.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } }, orderBy: { name: 'asc' } });
  return (
    <div>
      <AdminPageHeader
        eyebrow="Inventory"
        title="Add property"
        description="Create the listing, upload images, drag them into order, and use the first image as the hero."
        action={<Link href="/admin/properties" className="btn-secondary">Back</Link>}
      />
      <NewPropertyForm hosts={hosts.map(host => ({ id: host.id, name: host.name, email: host.email }))} />
    </div>
  );
}
