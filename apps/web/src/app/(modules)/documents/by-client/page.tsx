'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorClientePage() {
  return (
    <PageTemplate
      title="Por Cliente"
      subtitle="Gestión de por cliente"
      icon="👤"
      module="Documentos"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Por Cliente' }
      ]}
    />
  );
}
