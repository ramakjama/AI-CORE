'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function VacacionesPage() {
  return (
    <PageTemplate
      title="Vacaciones"
      subtitle="Gestión de vacaciones"
      icon="🏖️"
      module="RRHH"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Vacaciones' }
      ]}
    />
  );
}
