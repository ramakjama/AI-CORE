'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProgramadosPage() {
  return (
    <PageTemplate
      title="Programados"
      subtitle="Gestión de programados"
      icon="📅"
      module="Informes"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/analytics/reports' },
        { label: 'Programados' }
      ]}
    />
  );
}
