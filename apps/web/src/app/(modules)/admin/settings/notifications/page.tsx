'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NotificacionesPage() {
  return (
    <PageTemplate
      title="Notificaciones"
      subtitle="Gestión de notificaciones"
      icon="🔔"
      module="Configuración"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Notificaciones' }
      ]}
    />
  );
}
