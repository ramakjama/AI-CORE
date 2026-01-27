'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorSiniestroPage() {
  return (
    <PageTemplate
      title="Por Siniestro"
      subtitle="Gestión de por siniestro"
      icon="📈"
      module="Documentos"
      breadcrumb={[
        { label: 'Documents', path: '/documents' },
        { label: 'Por Siniestro' }
      ]}
    />
  );
}
