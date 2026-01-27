'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BandejadeEntradaPage() {
  return (
    <PageTemplate
      title="Bandeja de Entrada"
      subtitle="Gestión de bandeja de entrada"
      icon="📥"
      module="Email"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Email', path: '/communications/email' },
        { label: 'Bandeja de Entrada' }
      ]}
    />
  );
}
