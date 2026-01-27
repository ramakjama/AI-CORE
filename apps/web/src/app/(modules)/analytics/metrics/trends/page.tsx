'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TendenciasPage() {
  return (
    <PageTemplate
      title="Tendencias"
      subtitle="Gestión de tendencias"
      icon="📈"
      module="Métricas"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Metrics', path: '/analytics/metrics' },
        { label: 'Tendencias' }
      ]}
    />
  );
}
