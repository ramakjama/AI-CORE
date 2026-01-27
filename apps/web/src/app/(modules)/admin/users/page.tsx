'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function UsuariosPage() {
  return (
    <PageTemplate
      title="Usuarios"
      subtitle="Gestión de usuarios"
      icon="👤"
      module="Admin"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Usuarios' }
      ]}
    />
  );
}
