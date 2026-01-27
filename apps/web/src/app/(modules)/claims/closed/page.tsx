'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SiniestrosCerradosPage() {
  return (
    <PageTemplate
      title="Siniestros Cerrados"
      subtitle="Gestión de siniestros cerrados"
      icon="🔒"
      module="Siniestros"
      breadcrumb={[
        { label: 'Claims', path: '/claims' },
        { label: 'Siniestros Cerrados' }
      ]}
    />
  );
}
