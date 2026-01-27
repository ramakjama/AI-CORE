'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function VentasPage() {
  return (
    <PageTemplate
      title="Ventas"
      subtitle="Gestión de ventas"
      icon="💰"
      module="Dashboards"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Dashboards', path: '/analytics/dashboards' },
        { label: 'Ventas' }
      ]}
    />
  );
}
