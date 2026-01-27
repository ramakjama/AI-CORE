'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CartasPage() {
  return (
    <PageTemplate
      title="Cartas"
      subtitle="Gestión de cartas"
      icon="✉️"
      module="Plantillas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Templates', path: '/documents/templates' },
        { label: 'Cartas' }
      ]}
    />
  );
}
