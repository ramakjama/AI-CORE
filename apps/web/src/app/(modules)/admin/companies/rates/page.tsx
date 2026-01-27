'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TarifasPage() {
  return (
    <PageTemplate
      title="Tarifas"
      subtitle="Gestión de tarifas"
      icon="💵"
      module="Compañías"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Companies', path: '/admin/companies' },
        { label: 'Tarifas' }
      ]}
    />
  );
}
