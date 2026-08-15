import type { ReactNode } from 'react';
import './globals.css';
import { Background } from '@/components/Background';

export const metadata = {
  title: 'HANOON 3.0 — Dashboard',
  description: 'Real-time trading bot dashboard (10-layer architecture)',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="text-hanoon-text min-h-screen font-mono">
        <Background />
        <div className="relative z-10 min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}
