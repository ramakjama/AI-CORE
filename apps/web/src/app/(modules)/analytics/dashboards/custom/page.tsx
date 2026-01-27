'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PersonalizadoPage() {
  return (
    <PageTemplate
      title="Personalizado"
      subtitle="Gestión de personalizado"
      icon="🎨"
      module="Dashboards"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Dashboards', path: '/analytics/dashboards' },
        { label: 'Personalizado' }
      ]}
    />
  );
}
