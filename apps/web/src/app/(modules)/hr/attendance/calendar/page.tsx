'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CalendarioPage() {
  return (
    <PageTemplate
      title="Calendario"
      subtitle="Gestión de calendario"
      icon="📅"
      module="Control Horario"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Attendance', path: '/hr/attendance' },
        { label: 'Calendario' }
      ]}
    />
  );
}
