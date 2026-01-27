'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorCompaaPage() {
  return (
    <PageTemplate
      title="Por Compañía"
      subtitle="Gestión de por compañía"
      icon="🏢"
      module="Pólizas"
      breadcrumb={[
        { label: 'Policies', path: '/policies' },
        { label: 'Por Compañía' }
      ]}
    />
  );
}
