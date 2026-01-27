'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function InformesPage() {
  return (
    <PageTemplate
      title="Informes"
      subtitle="Gestión de informes"
      icon="📑"
      module="Analytics"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Informes' }
      ]}
    />
  );
}
