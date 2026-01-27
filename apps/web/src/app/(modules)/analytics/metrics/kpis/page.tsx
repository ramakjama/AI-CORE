'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function KPIsPage() {
  return (
    <PageTemplate
      title="KPIs"
      subtitle="Gestión de kpis"
      icon="🎯"
      module="Métricas"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Metrics', path: '/analytics/metrics' },
        { label: 'KPIs' }
      ]}
    />
  );
}
