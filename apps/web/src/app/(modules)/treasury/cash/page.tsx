'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CajaPage() {
  return (
    <PageTemplate
      title="Caja"
      subtitle="Gestión de caja"
      icon="💵"
      module="Tesorería"
      breadcrumb={[
        { label: 'Treasury', path: '/treasury' },
        { label: 'Caja' }
      ]}
    />
  );
}
