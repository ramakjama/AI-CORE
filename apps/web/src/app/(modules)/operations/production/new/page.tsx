'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevaProduccinPage() {
  return (
    <PageTemplate
      title="Nueva Producción"
      subtitle="Gestión de nueva producción"
      icon="➕"
      module="Producción"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Production', path: '/operations/production' },
        { label: 'Nueva Producción' }
      ]}
    />
  );
}
