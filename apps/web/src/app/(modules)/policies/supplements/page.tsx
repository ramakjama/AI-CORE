'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SuplementosPage() {
  return (
    <PageTemplate
      title="Suplementos"
      subtitle="Gestión de suplementos"
      icon="📝"
      module="Pólizas"
      breadcrumb={[
        { label: 'Policies', path: '/policies' },
        { label: 'Suplementos' }
      ]}
    />
  );
}
