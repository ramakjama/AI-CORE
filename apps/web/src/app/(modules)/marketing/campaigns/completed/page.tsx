'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FinalizadasPage() {
  return (
    <PageTemplate
      title="Finalizadas"
      subtitle="Gestión de finalizadas"
      icon="✅"
      module="Campañas"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Finalizadas' }
      ]}
    />
  );
}
