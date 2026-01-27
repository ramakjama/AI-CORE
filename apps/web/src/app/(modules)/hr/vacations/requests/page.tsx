'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SolicitudesPage() {
  return (
    <PageTemplate
      title="Solicitudes"
      subtitle="Gestión de solicitudes"
      icon="📝"
      module="Vacaciones"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Vacations', path: '/hr/vacations' },
        { label: 'Solicitudes' }
      ]}
    />
  );
}
