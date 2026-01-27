'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function KPIsEstratgicosPage() {
  return (
    <PageTemplate
      title="KPIs Estratégicos"
      subtitle="Gestión de kpis estratégicos"
      icon="📊"
      module="Planificación"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Planning', path: '/strategy/planning' },
        { label: 'KPIs Estratégicos' }
      ]}
    />
  );
}
