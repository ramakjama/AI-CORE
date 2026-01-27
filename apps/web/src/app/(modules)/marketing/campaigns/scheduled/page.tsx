'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProgramadasPage() {
  return (
    <PageTemplate
      title="Programadas"
      subtitle="Gestión de programadas"
      icon="📅"
      module="Campañas"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Programadas' }
      ]}
    />
  );
}
