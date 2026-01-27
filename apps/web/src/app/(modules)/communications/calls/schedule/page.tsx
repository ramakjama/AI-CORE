'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProgramarLlamadaPage() {
  return (
    <PageTemplate
      title="Programar Llamada"
      subtitle="Gestión de programar llamada"
      icon="📅"
      module="Teléfono"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Calls', path: '/communications/calls' },
        { label: 'Programar Llamada' }
      ]}
    />
  );
}
