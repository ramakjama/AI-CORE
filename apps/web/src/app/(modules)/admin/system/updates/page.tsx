'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ActualizacionesPage() {
  return (
    <PageTemplate
      title="Actualizaciones"
      subtitle="Gestión de actualizaciones"
      icon="🔄"
      module="Sistema"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'System', path: '/admin/system' },
        { label: 'Actualizaciones' }
      ]}
    />
  );
}
