import { AdminNav } from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream">
      <AdminNav />
      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</div>
    </main>
  );
}
