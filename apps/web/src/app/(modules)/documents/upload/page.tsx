'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SubirDocumentoPage() {
  return (
    <PageTemplate
      title="Subir Documento"
      subtitle="Gestión de subir documento"
      icon="⬆️"
      module="Documentos"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Subir Documento' }
      ]}
    />
  );
}
