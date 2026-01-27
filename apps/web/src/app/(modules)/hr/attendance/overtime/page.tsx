'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function HorasExtraPage() {
  return (
    <PageTemplate
      title="Horas Extra"
      subtitle="Gestión de horas extra"
      icon="⏱️"
      module="Control Horario"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Attendance', path: '/hr/attendance' },
        { label: 'Horas Extra' }
      ]}
    />
  );
}
