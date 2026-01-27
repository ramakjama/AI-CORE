'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ActividadPage() {
  return (
    <PageTemplate
      title="Actividad"
      subtitle="Gestión de actividad"
      icon="📋"
      module="Usuarios"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Users', path: '/admin/users' },
        { label: 'Actividad' }
      ]}
    />
  );
}
