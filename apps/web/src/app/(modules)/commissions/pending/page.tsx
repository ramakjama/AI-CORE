'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PendientesdeCobroPage() {
  return (
    <PageTemplate
      title="Pendientes de Cobro"
      subtitle="Gestión de pendientes de cobro"
      icon="⏳"
      module="Comisiones"
      breadcrumb={[
        { label: 'Commissions', path: '/commissions' },
        { label: 'Pendientes de Cobro' }
      ]}
    />
  );
}
