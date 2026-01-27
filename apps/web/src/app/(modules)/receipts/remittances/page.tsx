'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RemesasPage() {
  return (
    <PageTemplate
      title="Remesas"
      subtitle="Gestión de remesas"
      icon="📦"
      module="Recibos"
      breadcrumb={[
        { label: 'Receipts', path: '/receipts' },
        { label: 'Remesas' }
      ]}
    />
  );
}
