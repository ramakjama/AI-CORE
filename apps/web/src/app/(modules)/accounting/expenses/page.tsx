'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function GastosPage() {
  return (
    <PageTemplate
      title="Gastos"
      subtitle="Gestión de gastos"
      icon="💸"
      module="Contabilidad"
      breadcrumb={[
        { label: 'Accounting', path: '/accounting' },
        { label: 'Gastos' }
      ]}
    />
  );
}
