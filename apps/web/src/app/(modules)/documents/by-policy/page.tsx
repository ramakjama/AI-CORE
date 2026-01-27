'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorPlizaPage() {
  return (
    <PageTemplate
      title="Por Póliza"
      subtitle="Gestión de por póliza"
      icon="📋"
      module="Documentos"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Por Póliza' }
      ]}
    />
  );
}
