'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AnulacionesPage() {
  return (
    <PageTemplate
      title="Anulaciones"
      subtitle="Gestión de anulaciones"
      icon="❌"
      module="Producción"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Production', path: '/operations/production' },
        { label: 'Anulaciones' }
      ]}
    />
  );
}
