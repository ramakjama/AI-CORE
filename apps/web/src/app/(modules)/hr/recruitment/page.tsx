'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SeleccinPage() {
  return (
    <PageTemplate
      title="Selección"
      subtitle="Gestión de selección"
      icon="🎯"
      module="RRHH"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Selección' }
      ]}
    />
  );
}
