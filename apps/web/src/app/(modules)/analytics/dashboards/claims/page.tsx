'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SiniestralidadPage() {
  return (
    <PageTemplate
      title="Siniestralidad"
      subtitle="Gestión de siniestralidad"
      icon="📈"
      module="Dashboards"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Dashboards', path: '/analytics/dashboards' },
        { label: 'Siniestralidad' }
      ]}
    />
  );
}
