'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EvaluacionesPage() {
  return (
    <PageTemplate
      title="Evaluaciones"
      subtitle="Gestión de evaluaciones"
      icon="📝"
      module="Academia"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Evaluaciones' }
      ]}
    />
  );
}
