'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TcticasPage() {
  return (
    <PageTemplate
      title="Tácticas"
      subtitle="Gestión de tácticas"
      icon="♟️"
      module="Planificación"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Planning', path: '/strategy/planning' },
        { label: 'Tácticas' }
      ]}
    />
  );
}
