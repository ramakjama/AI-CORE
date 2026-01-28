import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ProvidersWrapper } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AIT Suite Portal - Ecosistema Integral de Gestión',
  description: 'Portal unificado para la gestión integral del ecosistema AIT-CORE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className}>
        <ProvidersWrapper>{children}</ProvidersWrapper>
      </body>
    </html>
  );
}
