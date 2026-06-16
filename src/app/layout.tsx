import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lets Book It',
  description: 'Direct booking website for vacation rental properties'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
