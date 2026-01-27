'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ImpuestosPage() {
  return (
    <PageTemplate
      title="Impuestos"
      subtitle="Gestión de impuestos"
      icon="🏛️"
      module="Contabilidad"
      breadcrumb={[
        { label: 'Accounting', path: '/accounting' },
        { label: 'Impuestos' }
      ]}
    />
  );
}
