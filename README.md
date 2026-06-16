# Lets Book It

Built with:

- Next.js / React
- TypeScript
- Tailwind CSS
- Prisma
- SQLite for local development, easy to swap to PostgreSQL
- iCal/ICS calendar import for Airbnb and Booking.com calendar links
- Admin centre for properties, bookings, blocked dates, and calendar feeds

## What this project includes

- Responsive public homepage based on the mockup direction
- Multi-property support
- Property detail pages at `/properties/[slug]`
- Campaign landing pages at `/stays/[slug]`
- Availability API that combines:
  - Airbnb iCal blocks
  - Booking.com iCal blocks
  - Manual admin blocks
  - Direct bookings
- Direct booking request API
- Admin dashboard at `/admin`
- Property management foundation
- Calendar feed management foundation
- Calendar sync script
- Prisma schema and seed data

## Important calendar limitation

Airbnb and Booking.com calendar export links are iCal/ICS feeds. They are useful for blocking unavailable dates, but they are not a full OTA/channel-manager API. They normally do not provide pricing, guest messages, payments, or rich guest data.

The intended flow is:

1. Add Airbnb / Booking.com iCal links to a property.
2. Run the calendar sync job.
3. Imported dates are stored as blocked dates.
4. Direct bookings are stored in your database.
5. Later you can expose your own iCal feed and import it into Airbnb / Booking.com to block direct bookings there.

For real production channel management, use a PMS/channel manager or official integration partner.

## Quick start

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Open:

- Public site: http://localhost:3000
- Property page: http://localhost:3000/properties/juniper-house
- Admin: http://localhost:3000/admin

The admin starter currently uses the password in `.env` for simple protection. Replace this with proper auth before production.

## Sync Airbnb / Booking.com calendars

Add a feed in the admin area or directly in the database, then run:

```bash
npm run sync:calendars
```

In production, run this on a cron schedule every 15-60 minutes. iCal feeds are not always instant, so never rely on them as a perfect real-time source.

## Production recommendations

Before taking payments or live bookings:

- Use PostgreSQL instead of SQLite
- Add proper auth, roles, and audit logs
- Add Stripe payment intents and webhooks
- Add transactional emails
- Add cancellation policy handling
- Add legal pages, privacy policy, terms, accessibility, and cookie compliance
- Add rate limiting and bot protection
- Add logging and error monitoring
- Add backup strategy

## Suggested next build steps

1. Replace placeholder images with your actual property images.
2. Add your real properties in `/admin/properties`.
3. Add Airbnb and Booking.com iCal URLs.
4. Replace booking request flow with Stripe checkout/payment intent.
5. Add outbound direct iCal feed endpoint per property.
6. Build a campaign page editor for targeted ads.


## Push to Git
git status
git add .
git commit -m "Describe what changed"
git push

TO DO

Admin
------------
Adding a property -
                Add Min Nights allowed to be entered
                Add a check box for if bookings should have a request or automatically book.
                Option to charge more for bank holidays and/or weekends.
                Choose who the host is.

Different user rights, Super Admin, Admin, Customer. Super Admin, needs access to adding users. Update login so it works for both, will also need a register user button and page

On the calender, there should be a button for edit pricing, this should toggle the behaviour of the calander to addmend the pricing for that day.

Bookings page, should also be calander view, if there is a booking, it should have an indication, such as customers Innital, and a red box. Pressing on it, should bring up a modal which shows booking information and an option to call or message the guest. there should also be a custom booking button, where admin can create a booking, and enter custom price, and be able to share a link so customer can fill details and pay. Link should be able to be copied or sent via email.

Admin should also have a report section, where it shows weekly, monthly, 3 month, 6 month and 1 year worth of bookings. This should be a toggle. It should also be able to give good insights into when busy periods are etc.

Create a discount code section for admins - Choose amount or percentage with a toggle. Select which property, choose the code or generate a random one, and the code's expiry.