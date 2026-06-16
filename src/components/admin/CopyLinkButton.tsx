'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

export function CopyLinkButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <button className="btn-secondary inline-flex items-center gap-2 py-2" type="button" onClick={copy}>
      <Copy className="h-4 w-4" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
