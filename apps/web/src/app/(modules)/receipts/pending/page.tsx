'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PendientesdeCobroPage() {
  return (
    <PageTemplate
      title="Pendientes de Cobro"
      subtitle="Gestión de pendientes de cobro"
      icon="⏳"
      module="Recibos"
      breadcrumb={[
        { label: 'Receipts', path: '/receipts' },
        { label: 'Pendientes de Cobro' }
      ]}
    />
  );
}
