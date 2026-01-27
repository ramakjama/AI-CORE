'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function IntegracionesPage() {
  return (
    <PageTemplate
      title="Integraciones"
      subtitle="Gestión de integraciones"
      icon="🔗"
      module="Configuración"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Integraciones' }
      ]}
    />
  );
}
