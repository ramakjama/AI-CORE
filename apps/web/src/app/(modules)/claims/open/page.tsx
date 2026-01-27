'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SiniestrosAbiertosPage() {
  return (
    <PageTemplate
      title="Siniestros Abiertos"
      subtitle="Gestión de siniestros abiertos"
      icon="🔓"
      module="Siniestros"
      breadcrumb={[
        { label: 'Claims', path: '/claims' },
        { label: 'Siniestros Abiertos' }
      ]}
    />
  );
}
