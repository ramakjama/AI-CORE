'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProductosPage() {
  return (
    <PageTemplate
      title="Productos"
      subtitle="Gestión de productos"
      icon="📦"
      module="Compañías"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Companies', path: '/admin/companies' },
        { label: 'Productos' }
      ]}
    />
  );
}
