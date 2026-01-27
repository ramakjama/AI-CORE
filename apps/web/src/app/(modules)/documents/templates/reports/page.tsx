'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function InformesPage() {
  return (
    <PageTemplate
      title="Informes"
      subtitle="Gestión de informes"
      icon="📊"
      module="Plantillas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Templates', path: '/documents/templates' },
        { label: 'Informes' }
      ]}
    />
  );
}
