'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PlandeAccinPage() {
  return (
    <PageTemplate
      title="Plan de Acción"
      subtitle="Gestión de plan de acción"
      icon="✅"
      module="Ejecución"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Execution', path: '/strategy/execution' },
        { label: 'Plan de Acción' }
      ]}
    />
  );
}
