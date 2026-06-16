import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { PublicNav } from '@/components/PublicNav';
import { BookingWidget } from '@/components/BookingWidget';
import { TrustBar } from '@/components/TrustBar';

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.landingPage.findUnique({ where: { slug }, include: { property: true } });
  if (!page) notFound();
  return <main><PublicNav/><section className="relative bg-ink text-white"><img src={page.property.heroImage} alt={page.property.name} className="absolute inset-0 h-full w-full object-cover opacity-50"/><div className="absolute inset-0 bg-black/50"/><div className="relative mx-auto max-w-7xl px-4 py-20 lg:grid lg:grid-cols-[1fr_500px] lg:gap-10 lg:px-8"><div><p className="label text-white/70">For {page.audience}</p><h1 className="mt-3 font-serif text-5xl md:text-7xl">{page.headline}</h1><p className="mt-5 text-xl text-white/85">{page.subheadline}</p><p className="mt-5 text-white/75">{page.body}</p></div><div className="mt-8 text-ink lg:mt-0"><BookingWidget propertySlug={page.property.slug} compact /></div></div></section><section className="mx-auto max-w-7xl px-4 py-10 lg:px-8"><TrustBar/></section></main>;
}
