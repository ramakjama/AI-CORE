'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ResultadosPage() {
  return (
    <PageTemplate
      title="Resultados"
      subtitle="Gestión de resultados"
      icon="📊"
      module="Campañas"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Resultados' }
      ]}
    />
  );
}
