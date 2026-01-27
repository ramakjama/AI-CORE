'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EstndarPage() {
  return (
    <PageTemplate
      title="Estándar"
      subtitle="Gestión de estándar"
      icon="📄"
      module="Informes"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/analytics/reports' },
        { label: 'Estándar' }
      ]}
    />
  );
}
