'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProduccinPage() {
  return (
    <PageTemplate
      title="Producción"
      subtitle="Gestión de producción"
      icon="📊"
      module="Operaciones"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Producción' }
      ]}
    />
  );
}
