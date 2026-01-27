'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PipelinedeVentasPage() {
  return (
    <PageTemplate
      title="Pipeline de Ventas"
      subtitle="Gestión de pipeline de ventas"
      icon="📊"
      module="Leads"
      breadcrumb={[
        { label: 'Leads', path: '/leads' },
        { label: 'Pipeline de Ventas' }
      ]}
    />
  );
}
