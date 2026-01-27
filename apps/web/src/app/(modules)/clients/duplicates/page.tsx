'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DuplicadosPage() {
  return (
    <PageTemplate
      title="Duplicados"
      subtitle="Gestión de duplicados"
      icon="🔄"
      module="Clientes"
      breadcrumb={[
        { label: 'Clients', path: '/clients' },
        { label: 'Duplicados' }
      ]}
    />
  );
}
