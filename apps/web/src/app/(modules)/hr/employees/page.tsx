'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EmpleadosPage() {
  return (
    <PageTemplate
      title="Empleados"
      subtitle="Gestión de empleados"
      icon="👥"
      module="RRHH"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Empleados' }
      ]}
    />
  );
}
