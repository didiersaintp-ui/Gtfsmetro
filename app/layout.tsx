import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GTFS Metro Map Visualizer',
  description: 'Professional GTFS transit data visualization with realistic and schematic metro map rendering',
  keywords: ['GTFS', 'metro', 'transit', 'map', 'visualization', 'public transport'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
