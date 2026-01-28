import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { AppLayout } from '@/components/layout/app-layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIT-CORE Soriano - Insurance Management Platform',
  description: 'Advanced Insurance Management Platform with real-time updates, comprehensive policy management, and AI-powered analytics',
  keywords: ['insurance', 'management', 'policies', 'claims', 'analytics'],
  authors: [{ name: 'AIT-CORE' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
