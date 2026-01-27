'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PagosPage() {
  return (
    <PageTemplate
      title="Pagos"
      subtitle="Gestión de pagos"
      icon="💳"
      module="Tesorería"
      breadcrumb={[
        { label: 'Treasury', path: '/treasury' },
        { label: 'Pagos' }
      ]}
    />
  );
}
