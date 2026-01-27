'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ReconciliacinPage() {
  return (
    <PageTemplate
      title="Reconciliación"
      subtitle="Gestión de reconciliación"
      icon="🔄"
      module="Comisiones"
      breadcrumb={[
        { label: 'Commissions', path: '/commissions' },
        { label: 'Reconciliación' }
      ]}
    />
  );
}
