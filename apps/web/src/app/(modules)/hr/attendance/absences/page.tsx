'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AusenciasPage() {
  return (
    <PageTemplate
      title="Ausencias"
      subtitle="Gestión de ausencias"
      icon="🚫"
      module="Control Horario"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Attendance', path: '/hr/attendance' },
        { label: 'Ausencias' }
      ]}
    />
  );
}
