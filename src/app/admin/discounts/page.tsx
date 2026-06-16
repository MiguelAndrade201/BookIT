import { redirect } from 'next/navigation';
import { Trash2, Wand2 } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { dollarsToCents } from '@/lib/admin';
import { formatMoney } from '@/lib/money';
import { prisma } from '@/lib/prisma';

function randomCode() {
  return `STAY-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function createDiscount(formData: FormData) {
  'use server';
  const type = String(formData.get('type'));
  const rawCode = String(formData.get('code') || '').trim().toUpperCase();
  await prisma.discountCode.create({
    data: {
      propertyId: String(formData.get('propertyId') || '') || null,
      code: rawCode || randomCode(),
      type,
      value: type === 'PERCENT' ? Number(formData.get('value') || 0) : dollarsToCents(formData.get('value')),
      expiresAt: new Date(`${formData.get('expiresAt')}T23:59:59`)
    }
  });
  redirect('/admin/discounts');
}

async function deleteDiscount(formData: FormData) {
  'use server';
  await prisma.discountCode.delete({ where: { id: String(formData.get('id')) } });
  redirect('/admin/discounts');
}

export default async function DiscountsPage() {
  const [properties, discounts] = await Promise.all([
    prisma.property.findMany({ orderBy: { name: 'asc' } }),
    prisma.discountCode.findMany({ include: { property: true }, orderBy: { createdAt: 'desc' } })
  ]);

  return (
    <div>
      <AdminPageHeader eyebrow="Promotions" title="Discount Codes" description="Create amount or percentage codes for one property or all properties." />
      <section className="mt-6 grid gap-6 lg:grid-cols-[420px_1fr]">
        <form action={createDiscount} className="grid gap-3 rounded-xl border border-black/10 bg-white p-5 shadow-soft">
          <h2 className="font-serif text-2xl">Create code</h2>
          <label><span className="label">Property</span><select className="input mt-1" name="propertyId" defaultValue="">
            <option value="">All properties</option>
            {properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}
          </select></label>
          <label><span className="label">Code</span><input className="input mt-1" name="code" placeholder="Leave blank to generate" /></label>
          <label><span className="label">Discount type</span><select className="input mt-1" name="type" defaultValue="PERCENT">
            <option value="PERCENT">Percentage</option>
            <option value="AMOUNT">Amount</option>
          </select></label>
          <label><span className="label">Amount or percent</span><input className="input mt-1" name="value" type="number" min="0" step=".01" required /></label>
          <label><span className="label">Expiry date</span><input className="input mt-1" name="expiresAt" type="date" required /></label>
          <button className="btn-primary inline-flex items-center justify-center gap-2"><Wand2 className="h-4 w-4" /> Create Discount</button>
        </form>
        <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-soft">
          <table className="w-full text-left text-sm">
            <thead className="bg-sand/40 text-xs uppercase tracking-wider text-black/55"><tr><th className="p-4">Code</th><th>Property</th><th>Value</th><th>Expires</th><th className="pr-4 text-right">Actions</th></tr></thead>
            <tbody>
              {discounts.map(discount => (
                <tr key={discount.id} className="border-t border-black/10">
                  <td className="p-4 font-semibold">{discount.code}</td>
                  <td>{discount.property?.name ?? 'All properties'}</td>
                  <td>{discount.type === 'PERCENT' ? `${discount.value}%` : formatMoney(discount.value)}</td>
                  <td>{discount.expiresAt.toLocaleDateString()}</td>
                  <td className="pr-4 text-right"><form action={deleteDiscount}><input type="hidden" name="id" value={discount.id} /><button className="rounded-xl border border-black/10 bg-white p-2 text-red-700 hover:bg-red-50" title="Delete discount" aria-label="Delete discount"><Trash2 className="h-4 w-4" /></button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
