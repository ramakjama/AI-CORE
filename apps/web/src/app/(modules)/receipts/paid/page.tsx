'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CobradosPage() {
  return (
    <PageTemplate
      title="Cobrados"
      subtitle="Gestión de cobrados"
      icon="✅"
      module="Recibos"
      breadcrumb={[
        { label: 'Receipts', path: '/receipts' },
        { label: 'Cobrados' }
      ]}
    />
  );
}
