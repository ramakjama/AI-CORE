'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function GrabacionesPage() {
  return (
    <PageTemplate
      title="Grabaciones"
      subtitle="Gestión de grabaciones"
      icon="🎙️"
      module="Teléfono"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Calls', path: '/communications/calls' },
        { label: 'Grabaciones' }
      ]}
    />
  );
}
