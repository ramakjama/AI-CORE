'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PendienteEmisinPage() {
  return (
    <PageTemplate
      title="Pendiente Emisión"
      subtitle="Gestión de pendiente emisión"
      icon="⏳"
      module="Producción"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Production', path: '/operations/production' },
        { label: 'Pendiente Emisión' }
      ]}
    />
  );
}
