'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ResultadosPage() {
  return (
    <PageTemplate
      title="Resultados"
      subtitle="Gestión de resultados"
      icon="📊"
      module="Evaluaciones"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Exams', path: '/academy/exams' },
        { label: 'Resultados' }
      ]}
    />
  );
}
