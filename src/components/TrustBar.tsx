import { BadgePercent, HandHeart, PiggyBank, TicketPercent } from 'lucide-react';

const items = [
  [PiggyBank, 'Skip Platform Fees', 'Book direct and avoid extra marketplace charges'],
  [BadgePercent, 'Best Direct Price', 'Always get the strongest rate from the host'],
  [TicketPercent, 'Next-Stay Discount', 'Book once and receive a code for your next trip'],
  [HandHeart, 'Help Hosts', 'More of your spend supports the people hosting you']
] as const;

export function TrustBar() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map(([Icon, title, sub]) => (
        <div className="rounded-xl border border-black/10 bg-white/75 p-4" key={title}>
          <Icon className="mb-2 h-6 w-6 text-sage" />
          <div className="font-semibold">{title}</div>
          <div className="text-sm text-black/60">{sub}</div>
        </div>
      ))}
    </div>
  );
}
