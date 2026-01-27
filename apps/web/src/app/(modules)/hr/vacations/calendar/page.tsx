'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CalendarioPage() {
  return (
    <PageTemplate
      title="Calendario"
      subtitle="Gestión de calendario"
      icon="📅"
      module="Vacaciones"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Vacations', path: '/hr/vacations' },
        { label: 'Calendario' }
      ]}
    />
  );
}
