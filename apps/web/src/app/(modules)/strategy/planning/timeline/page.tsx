'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CronogramaPage() {
  return (
    <PageTemplate
      title="Cronograma"
      subtitle="Gestión de cronograma"
      icon="📅"
      module="Planificación"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Planning', path: '/strategy/planning' },
        { label: 'Cronograma' }
      ]}
    />
  );
}
