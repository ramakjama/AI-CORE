'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FirmaDigitalPage() {
  return (
    <PageTemplate
      title="Firma Digital"
      subtitle="Gestión de firma digital"
      icon="✍️"
      module="Documentos"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Firma Digital' }
      ]}
    />
  );
}
