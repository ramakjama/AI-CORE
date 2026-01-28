import type { Metadata } from 'next';
// Temporalmente deshabilitado por error de webpack
// import { Inter } from 'next/font/google';
import './globals.css';

// const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI-CORE ERP - Sistema de Gestión de Seguros con IA',
  description: 'El ERP de seguros más avanzado del mundo con IA integrada',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
