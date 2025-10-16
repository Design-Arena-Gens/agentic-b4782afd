import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CCTV Standoff',
  description: 'Low-angle CCTV-style scene: tiger vs dog',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
