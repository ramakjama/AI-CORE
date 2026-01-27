'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CarteraPage() {
  return (
    <PageTemplate
      title="Cartera"
      subtitle="Gestión de cartera"
      icon="💼"
      module="Dashboards"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Dashboards', path: '/analytics/dashboards' },
        { label: 'Cartera' }
      ]}
    />
  );
}
