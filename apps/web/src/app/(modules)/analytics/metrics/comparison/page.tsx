'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ComparativasPage() {
  return (
    <PageTemplate
      title="Comparativas"
      subtitle="Gestión de comparativas"
      icon="⚖️"
      module="Métricas"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Metrics', path: '/analytics/metrics' },
        { label: 'Comparativas' }
      ]}
    />
  );
}
