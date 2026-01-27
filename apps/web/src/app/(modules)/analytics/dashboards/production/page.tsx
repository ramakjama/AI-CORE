'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProduccinPage() {
  return (
    <PageTemplate
      title="Producción"
      subtitle="Gestión de producción"
      icon="🏭"
      module="Dashboards"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Dashboards', path: '/analytics/dashboards' },
        { label: 'Producción' }
      ]}
    />
  );
}
