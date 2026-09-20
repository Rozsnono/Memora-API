import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memora Backend & Admin',
  description: 'API and Administration panel for Memora',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0F172A] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
