'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ContratosPage() {
  return (
    <PageTemplate
      title="Contratos"
      subtitle="Gestión de contratos"
      icon="📜"
      module="Plantillas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Templates', path: '/documents/templates' },
        { label: 'Contratos' }
      ]}
    />
  );
}
