'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SolicitarFirmaPage() {
  return (
    <PageTemplate
      title="Solicitar Firma"
      subtitle="Gestión de solicitar firma"
      icon="📤"
      module="Firmas"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Signatures', path: '/documents/signatures' },
        { label: 'Solicitar Firma' }
      ]}
    />
  );
}
