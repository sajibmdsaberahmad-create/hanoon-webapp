import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'HANOON 3.0 — Dashboard',
  description: 'Real-time trading bot dashboard (10-layer architecture)',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-hanoon-bg text-hanoon-text min-h-screen font-mono">
        {children}
      </body>
    </html>
  );
}
