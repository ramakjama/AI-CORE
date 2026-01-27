'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ResultadosPage() {
  return (
    <PageTemplate
      title="Resultados"
      subtitle="Gestión de resultados"
      icon="📈"
      module="Ejecución"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Execution', path: '/strategy/execution' },
        { label: 'Resultados' }
      ]}
    />
  );
}
