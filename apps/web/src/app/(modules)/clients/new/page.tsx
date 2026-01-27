'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevoClientePage() {
  return (
    <PageTemplate
      title="Nuevo Cliente"
      subtitle="Gestión de nuevo cliente"
      icon="➕"
      module="Clientes"
      breadcrumb={[
        { label: 'Clients', path: '/clients' },
        { label: 'Nuevo Cliente' }
      ]}
    />
  );
}
