'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorRamoPage() {
  return (
    <PageTemplate
      title="Por Ramo"
      subtitle="Gestión de por ramo"
      icon="📂"
      module="Pólizas"
      breadcrumb={[
        { label: 'Policies', path: '/policies' },
        { label: 'Por Ramo' }
      ]}
    />
  );
}
