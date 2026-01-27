'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FirmadosPage() {
  return (
    <PageTemplate
      title="Firmados"
      subtitle="Gestión de firmados"
      icon="✅"
      module="Firmas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Signatures', path: '/documents/signatures' },
        { label: 'Firmados' }
      ]}
    />
  );
}
