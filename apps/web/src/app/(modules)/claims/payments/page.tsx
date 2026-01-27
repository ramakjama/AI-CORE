'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function IndemnizacionesPage() {
  return (
    <PageTemplate
      title="Indemnizaciones"
      subtitle="Gestión de indemnizaciones"
      icon="💳"
      module="Siniestros"
      breadcrumb={[
        { label: 'Claims', path: '/claims' },
        { label: 'Indemnizaciones' }
      ]}
    />
  );
}
