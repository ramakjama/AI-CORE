'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevoSiniestroPage() {
  return (
    <PageTemplate
      title="Nuevo Siniestro"
      subtitle="Gestión de nuevo siniestro"
      icon="➕"
      module="Siniestros"
      breadcrumb={[
        { label: 'Claims', path: '/claims' },
        { label: 'Nuevo Siniestro' }
      ]}
    />
  );
}
