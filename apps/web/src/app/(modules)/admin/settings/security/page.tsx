'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SeguridadPage() {
  return (
    <PageTemplate
      title="Seguridad"
      subtitle="Gestión de seguridad"
      icon="🔒"
      module="Configuración"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Seguridad' }
      ]}
    />
  );
}
