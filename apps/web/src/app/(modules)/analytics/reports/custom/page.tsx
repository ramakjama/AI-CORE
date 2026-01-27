'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PersonalizadosPage() {
  return (
    <PageTemplate
      title="Personalizados"
      subtitle="Gestión de personalizados"
      icon="🎨"
      module="Informes"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/analytics/reports' },
        { label: 'Personalizados' }
      ]}
    />
  );
}
