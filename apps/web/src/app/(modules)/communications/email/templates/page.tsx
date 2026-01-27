'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PlantillasPage() {
  return (
    <PageTemplate
      title="Plantillas"
      subtitle="Gestión de plantillas"
      icon="📄"
      module="Email"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Email', path: '/communications/email' },
        { label: 'Plantillas' }
      ]}
    />
  );
}
