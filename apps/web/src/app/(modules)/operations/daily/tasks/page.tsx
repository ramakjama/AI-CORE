'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TareasdelDaPage() {
  return (
    <PageTemplate
      title="Tareas del Día"
      subtitle="Gestión de tareas del día"
      icon="✅"
      module="Operativa"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Daily', path: '/operations/daily' },
        { label: 'Tareas del Día' }
      ]}
    />
  );
}
