'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ContratosPage() {
  return (
    <PageTemplate
      title="Contratos"
      subtitle="Gestión de contratos"
      icon="📜"
      module="Empleados"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Employees', path: '/hr/employees' },
        { label: 'Contratos' }
      ]}
    />
  );
}
