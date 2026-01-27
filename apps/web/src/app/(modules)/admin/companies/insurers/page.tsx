'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AseguradorasPage() {
  return (
    <PageTemplate
      title="Aseguradoras"
      subtitle="Gestión de aseguradoras"
      icon="🏛️"
      module="Compañías"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Companies', path: '/admin/companies' },
        { label: 'Aseguradoras' }
      ]}
    />
  );
}
