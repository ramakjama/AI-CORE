'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ReseasPage() {
  return (
    <PageTemplate
      title="Reseñas"
      subtitle="Gestión de reseñas"
      icon="💬"
      module="Calidad"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Quality', path: '/operations/quality' },
        { label: 'Reseñas' }
      ]}
    />
  );
}
