export function dollarsToCents(value: FormDataEntryValue | null) {
  return Math.round(Number(value || 0) * 100);
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDateRange(start: Date, end: Date) {
  return `${start.toLocaleDateString()} -> ${end.toLocaleDateString()}`;
}

export function statusBadgeClass(status: string) {
  const styles: Record<string, string> = {
    LIVE: 'bg-green-50 text-green-700 ring-green-600/20',
    DRAFT: 'bg-stone-100 text-stone-700 ring-stone-600/20',
    PENDING: 'bg-amber-50 text-amber-800 ring-amber-600/20',
    CONFIRMED: 'bg-green-50 text-green-700 ring-green-600/20',
    CANCELLED: 'bg-red-50 text-red-700 ring-red-600/20'
  };

  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${styles[status] ?? styles.DRAFT}`;
}
