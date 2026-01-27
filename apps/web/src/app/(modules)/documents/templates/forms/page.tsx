'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FormulariosPage() {
  return (
    <PageTemplate
      title="Formularios"
      subtitle="Gestión de formularios"
      icon="📝"
      module="Plantillas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Templates', path: '/documents/templates' },
        { label: 'Formularios' }
      ]}
    />
  );
}
