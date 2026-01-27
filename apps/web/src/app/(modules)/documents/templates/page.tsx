'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PlantillasPage() {
  return (
    <PageTemplate
      title="Plantillas"
      subtitle="Gestión de plantillas"
      icon="📄"
      module="Documentos"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Plantillas' }
      ]}
    />
  );
}
