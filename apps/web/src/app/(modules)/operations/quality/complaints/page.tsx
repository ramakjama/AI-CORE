'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ReclamacionesPage() {
  return (
    <PageTemplate
      title="Reclamaciones"
      subtitle="Gestión de reclamaciones"
      icon="⚠️"
      module="Calidad"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Quality', path: '/operations/quality' },
        { label: 'Reclamaciones' }
      ]}
    />
  );
}
