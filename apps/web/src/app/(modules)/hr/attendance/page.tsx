'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ControlHorarioPage() {
  return (
    <PageTemplate
      title="Control Horario"
      subtitle="Gestión de control horario"
      icon="⏰"
      module="RRHH"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Control Horario' }
      ]}
    />
  );
}
