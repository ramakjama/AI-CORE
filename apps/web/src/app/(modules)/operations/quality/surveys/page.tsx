'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EncuestasPage() {
  return (
    <PageTemplate
      title="Encuestas"
      subtitle="Gestión de encuestas"
      icon="📝"
      module="Calidad"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Quality', path: '/operations/quality' },
        { label: 'Encuestas' }
      ]}
    />
  );
}
