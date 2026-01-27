'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SeguimientoPage() {
  return (
    <PageTemplate
      title="Seguimiento"
      subtitle="Gestión de seguimiento"
      icon="👁️"
      module="Ejecución"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Execution', path: '/strategy/execution' },
        { label: 'Seguimiento' }
      ]}
    />
  );
}
