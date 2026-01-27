'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CobradasPage() {
  return (
    <PageTemplate
      title="Cobradas"
      subtitle="Gestión de cobradas"
      icon="✅"
      module="Comisiones"
      breadcrumb={[
        { label: 'Commissions', path: '/commissions' },
        { label: 'Cobradas' }
      ]}
    />
  );
}
