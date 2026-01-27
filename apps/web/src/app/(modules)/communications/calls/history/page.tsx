'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function HistorialdeLlamadasPage() {
  return (
    <PageTemplate
      title="Historial de Llamadas"
      subtitle="Gestión de historial de llamadas"
      icon="📋"
      module="Teléfono"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Calls', path: '/communications/calls' },
        { label: 'Historial de Llamadas' }
      ]}
    />
  );
}
