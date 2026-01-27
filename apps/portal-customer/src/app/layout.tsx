import type { ReactNode } from 'react';

import './globals.css';

export const metadata = {
  title: 'AI-CORE Customer Portal',
  description: 'Customer portal',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
