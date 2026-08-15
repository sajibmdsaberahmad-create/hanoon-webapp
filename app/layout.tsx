import type { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Background } from '@/components/Background';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'HANOON 3.0 — Trading Intelligence',
  description:
    'Real-time trading dashboard for the HANOON 3.0 10-layer autonomous trading architecture.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${jetbrains.variable}`}>
      <body className="text-hanoon-text min-h-screen font-sans">
        <Background />
        <div className="relative z-10 min-h-screen overflow-x-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
