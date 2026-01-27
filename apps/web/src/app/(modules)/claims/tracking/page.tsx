'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SeguimientoPage() {
  return (
    <PageTemplate
      title="Seguimiento"
      subtitle="Gestión de seguimiento"
      icon="👁️"
      module="Siniestros"
      breadcrumb={[
        { label: 'Claims', path: '/claims' },
        { label: 'Seguimiento' }
      ]}
    />
  );
}
