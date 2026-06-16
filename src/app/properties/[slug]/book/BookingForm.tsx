'use client';
import { useState } from 'react';

export default function BookingForm(props: any) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = { ...props, firstName: form.get('firstName'), lastName: form.get('lastName'), email: form.get('email'), phone: form.get('phone'), promoCode: form.get('promoCode'), notes: form.get('notes') };
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setLoading(false);
    if (res.ok) setDone(true); else alert('Booking could not be created.');
  }
  if (done) return <div className="mt-5 rounded-2xl bg-green-50 p-5 text-green-800">Booking request created. Your host will confirm the stay and send a discount code for your next trip.</div>;
  return <form onSubmit={submit} className="mt-6 grid gap-4"><div className="grid gap-4 md:grid-cols-2"><input className="input" name="firstName" placeholder="First name" required/><input className="input" name="lastName" placeholder="Last name" required/></div><input className="input" type="email" name="email" placeholder="Email" required/><input className="input" name="phone" placeholder="Phone optional"/><input className="input" name="promoCode" placeholder="Promo code optional"/><textarea className="input" name="notes" placeholder="Anything the host should know?"/><button disabled={loading} className="btn-primary text-lg" type="submit">{loading ? 'Creating booking...' : 'Book Now'}</button></form>;
}
