'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DashboardsPage() {
  return (
    <PageTemplate
      title="Dashboards"
      subtitle="Gestión de dashboards"
      icon="📊"
      module="Analytics"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Dashboards' }
      ]}
    />
  );
}
