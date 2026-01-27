'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function OperativaDiariaPage() {
  return (
    <PageTemplate
      title="Operativa Diaria"
      subtitle="Gestión de operativa diaria"
      icon="📆"
      module="Operaciones"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Operativa Diaria' }
      ]}
    />
  );
}
