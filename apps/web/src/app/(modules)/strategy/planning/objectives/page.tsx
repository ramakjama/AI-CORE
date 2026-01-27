'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ObjetivosPage() {
  return (
    <PageTemplate
      title="Objetivos"
      subtitle="Gestión de objetivos"
      icon="🎯"
      module="Planificación"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Planning', path: '/strategy/planning' },
        { label: 'Objetivos' }
      ]}
    />
  );
}
