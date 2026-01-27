'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PendientesPage() {
  return (
    <PageTemplate
      title="Pendientes"
      subtitle="Gestión de pendientes"
      icon="⏳"
      module="Evaluaciones"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Exams', path: '/academy/exams' },
        { label: 'Pendientes' }
      ]}
    />
  );
}
