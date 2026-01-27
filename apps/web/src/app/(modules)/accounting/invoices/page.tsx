'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FacturasPage() {
  return (
    <PageTemplate
      title="Facturas"
      subtitle="Gestión de facturas"
      icon="🧾"
      module="Contabilidad"
      breadcrumb={[
        { label: 'Accounting', path: '/accounting' },
        { label: 'Facturas' }
      ]}
    />
  );
}
