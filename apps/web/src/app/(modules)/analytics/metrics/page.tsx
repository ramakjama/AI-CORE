'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function MtricasPage() {
  return (
    <PageTemplate
      title="Métricas"
      subtitle="Gestión de métricas"
      icon="📏"
      module="Analytics"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Métricas' }
      ]}
    />
  );
}
