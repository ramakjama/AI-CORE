'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AltaEmpleadoPage() {
  return (
    <PageTemplate
      title="Alta Empleado"
      subtitle="Gestión de alta empleado"
      icon="➕"
      module="Empleados"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Employees', path: '/hr/employees' },
        { label: 'Alta Empleado' }
      ]}
    />
  );
}
