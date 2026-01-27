'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TelfonoPage() {
  return (
    <PageTemplate
      title="Teléfono"
      subtitle="Gestión de teléfono"
      icon="📞"
      module="Comunicaciones"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Teléfono' }
      ]}
    />
  );
}
