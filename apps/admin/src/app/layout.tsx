import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI-CORE Admin',
  description: 'Panel de Administración - Sistema Operativo de Business Intelligence',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
