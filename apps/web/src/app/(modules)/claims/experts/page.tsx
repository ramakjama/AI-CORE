'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PeritajesPage() {
  return (
    <PageTemplate
      title="Peritajes"
      subtitle="Gestión de peritajes"
      icon="🔍"
      module="Siniestros"
      breadcrumb={[
        { label: 'Claims', path: '/claims' },
        { label: 'Peritajes' }
      ]}
    />
  );
}
