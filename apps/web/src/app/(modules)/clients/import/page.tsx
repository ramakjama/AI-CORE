'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ImportarClientesPage() {
  return (
    <PageTemplate
      title="Importar Clientes"
      subtitle="Gestión de importar clientes"
      icon="📤"
      module="Clientes"
      breadcrumb={[
        { label: 'Clients', path: '/clients' },
        { label: 'Importar Clientes' }
      ]}
    />
  );
}
