'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PendientesdeFirmaPage() {
  return (
    <PageTemplate
      title="Pendientes de Firma"
      subtitle="Gestión de pendientes de firma"
      icon="⏳"
      module="Firmas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Signatures', path: '/documents/signatures' },
        { label: 'Pendientes de Firma' }
      ]}
    />
  );
}
