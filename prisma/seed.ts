import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.property.deleteMany();
  await prisma.amenity.deleteMany();

  const amenities = await Promise.all([
    ['Hot Tub', 'Waves'], ['Fire Pit', 'Flame'], ['BBQ Grill', 'Utensils'], ['Outdoor Dining', 'Wine'],
    ['Fast Wi‑Fi', 'Wifi'], ['Self Check-In', 'KeyRound'], ['Free Parking', 'Car'], ['Washer & Dryer', 'Shirt']
  ].map(([name, icon]) => prisma.amenity.create({ data: { name, icon } })));

  const property = await prisma.property.create({
    data: {
      slug: 'juniper-house',
      name: 'The Juniper House',
      tagline: 'A private California escape designed for slow mornings, sunset dinners, and easy direct booking.',
      location: 'Sonoma, CA',
      address: '3947 Juniper Lane, Sonoma, CA 95476',
      description: 'A warm, design-led retreat with mountain views, a private deck, fire pit, hot tub, and everything you need for a relaxed getaway.',
      maxGuests: 8,
      bedrooms: 3,
      bathrooms: 2.5,
      baseNightlyRate: 65000,
      cleaningFee: 15000,
      serviceFee: 0,
      heroImage: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop',
      status: 'LIVE',
      images: {
        create: [
          { url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop', alt: 'Warm living room with fireplace', sortOrder: 1 },
          { url: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=1200&auto=format&fit=crop', alt: 'Bright kitchen and dining area', sortOrder: 2 },
          { url: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=1200&auto=format&fit=crop', alt: 'Comfortable bedroom', sortOrder: 3 },
          { url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=1200&auto=format&fit=crop', alt: 'Outdoor deck area', sortOrder: 4 }
        ]
      },
      reviews: {
        create: [
          { guestName: 'Sarah M.', rating: 5, body: 'Absolutely perfect. Even better than the photos — peaceful, spotless, and beautifully designed.', source: 'Airbnb' },
          { guestName: 'James T.', rating: 5, body: 'Immaculate and cozy. Every detail was thoughtful. We felt right at home.', source: 'Direct' },
          { guestName: 'Lisa R.', rating: 5, body: 'Best host ever. Quick, kind, helpful, and full of great local recommendations.', source: 'Booking.com' }
        ]
      },
      landingPages: {
        create: [
          {
            slug: 'romantic-getaway-sonoma',
            audience: 'Couples',
            headline: 'A Private Sonoma Escape for Two',
            subheadline: 'Book direct for the best rate, direct host support, and a peaceful retreat close to wineries and restaurants.',
            body: 'Perfect for anniversaries, weekend breaks, and quiet luxury escapes.',
            cta: 'Check Romantic Dates'
          },
          {
            slug: 'family-friendly-sonoma',
            audience: 'Families',
            headline: 'A Spacious Family Stay in Sonoma',
            subheadline: 'Room to cook, relax, park easily, and explore Sonoma together.',
            body: 'Ideal for families who want comfort, space, privacy, and simple direct booking.',
            cta: 'Check Family Availability'
          }
        ]
      }
    }
  });

  for (const amenity of amenities) {
    await prisma.propertyAmenity.create({ data: { propertyId: property.id, amenityId: amenity.id } });
  }
}

main().finally(() => prisma.$disconnect());
