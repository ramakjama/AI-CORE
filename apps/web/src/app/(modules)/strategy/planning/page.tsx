'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PlanificacinPage() {
  return (
    <PageTemplate
      title="Planificación"
      subtitle="Gestión de planificación"
      icon="📋"
      module="Estrategia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Planificación' }
      ]}
    />
  );
}
