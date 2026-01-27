'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ObjetivosPage() {
  return (
    <PageTemplate
      title="Objetivos"
      subtitle="Gestión de objetivos"
      icon="🏆"
      module="Métricas"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Metrics', path: '/analytics/metrics' },
        { label: 'Objetivos' }
      ]}
    />
  );
}
