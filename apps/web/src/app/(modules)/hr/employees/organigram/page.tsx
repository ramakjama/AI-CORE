'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function OrganigramaPage() {
  return (
    <PageTemplate
      title="Organigrama"
      subtitle="Gestión de organigrama"
      icon="🏛️"
      module="Empleados"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Employees', path: '/hr/employees' },
        { label: 'Organigrama' }
      ]}
    />
  );
}
