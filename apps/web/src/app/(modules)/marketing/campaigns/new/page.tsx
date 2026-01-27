'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevaCampaaPage() {
  return (
    <PageTemplate
      title="Nueva Campaña"
      subtitle="Gestión de nueva campaña"
      icon="➕"
      module="Campañas"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Nueva Campaña' }
      ]}
    />
  );
}
