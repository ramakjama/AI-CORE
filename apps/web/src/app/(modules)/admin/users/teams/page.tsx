'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EquiposPage() {
  return (
    <PageTemplate
      title="Equipos"
      subtitle="Gestión de equipos"
      icon="👥"
      module="Usuarios"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Equipos' }
      ]}
    />
  );
}
