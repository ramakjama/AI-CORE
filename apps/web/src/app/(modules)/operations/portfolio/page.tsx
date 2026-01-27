'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CarteraPage() {
  return (
    <PageTemplate
      title="Cartera"
      subtitle="Gestión de cartera"
      icon="💼"
      module="Operaciones"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Cartera' }
      ]}
    />
  );
}
