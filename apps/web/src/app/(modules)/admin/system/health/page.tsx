'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EstadodelSistemaPage() {
  return (
    <PageTemplate
      title="Estado del Sistema"
      subtitle="Gestión de estado del sistema"
      icon="❤️"
      module="Sistema"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'System', path: '/admin/system' },
        { label: 'Estado del Sistema' }
      ]}
    />
  );
}
