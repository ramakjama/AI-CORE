'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RolesyPermisosPage() {
  return (
    <PageTemplate
      title="Roles y Permisos"
      subtitle="Gestión de roles y permisos"
      icon="🔐"
      module="Usuarios"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Roles y Permisos' }
      ]}
    />
  );
}
