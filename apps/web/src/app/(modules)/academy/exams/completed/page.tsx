'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompletadosPage() {
  return (
    <PageTemplate
      title="Completados"
      subtitle="Gestión de completados"
      icon="✅"
      module="Evaluaciones"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Exams', path: '/academy/exams' },
        { label: 'Completados' }
      ]}
    />
  );
}
