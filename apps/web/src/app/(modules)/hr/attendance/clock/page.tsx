'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FichajesPage() {
  return (
    <PageTemplate
      title="Fichajes"
      subtitle="Gestión de fichajes"
      icon="🕐"
      module="Control Horario"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Attendance', path: '/hr/attendance' },
        { label: 'Fichajes' }
      ]}
    />
  );
}
