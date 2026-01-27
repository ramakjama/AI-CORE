'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevoUsuarioPage() {
  return (
    <PageTemplate
      title="Nuevo Usuario"
      subtitle="Gestión de nuevo usuario"
      icon="➕"
      module="Usuarios"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Nuevo Usuario' }
      ]}
    />
  );
}
