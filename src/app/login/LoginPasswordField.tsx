'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export function LoginPasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      <span className="label">Password *</span>
      <span className="mt-1 flex rounded-xl border border-black/10 bg-white focus-within:ring-2 focus-within:ring-sage/50 focus-within:ring-offset-2">
        <input
          className="min-w-0 flex-1 rounded-l-xl bg-transparent px-4 py-3 text-[16px] outline-none sm:text-sm"
          type={visible ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          required
        />
        <button
          className="grid w-12 shrink-0 place-items-center rounded-r-xl text-black/55 hover:text-ink"
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          title={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </span>
    </label>
  );
}
