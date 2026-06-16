import type { ReactNode } from 'react';

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-black/15 bg-white/70 p-8 text-center">
      <h2 className="font-serif text-2xl">{title}</h2>
      {children ? <div className="mt-2 text-sm text-black/60">{children}</div> : null}
    </div>
  );
}
