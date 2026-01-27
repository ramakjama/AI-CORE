'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RappelsPage() {
  return (
    <PageTemplate
      title="Rappels"
      subtitle="Gestión de rappels"
      icon="🎁"
      module="Comisiones"
      breadcrumb={[
        { label: 'Commissions', path: '/commissions' },
        { label: 'Rappels' }
      ]}
    />
  );
}
