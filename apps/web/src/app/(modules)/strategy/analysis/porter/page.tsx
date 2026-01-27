'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function Porter5FuerzasPage() {
  return (
    <PageTemplate
      title="Porter 5 Fuerzas"
      subtitle="Gestión de porter 5 fuerzas"
      icon="⚔️"
      module="Análisis"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Analysis', path: '/strategy/analysis' },
        { label: 'Porter 5 Fuerzas' }
      ]}
    />
  );
}
