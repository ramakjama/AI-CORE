'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BasesdeDatosPage() {
  return (
    <PageTemplate
      title="Bases de Datos"
      subtitle="Gestión de bases de datos"
      icon="💾"
      module="Sistema"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'System', path: '/admin/system' },
        { label: 'Bases de Datos' }
      ]}
    />
  );
}
