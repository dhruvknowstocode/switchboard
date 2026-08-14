import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Folio — Switchboard Demo',
  description: 'A magazine reading experience controlled by Switchboard feature flags',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
