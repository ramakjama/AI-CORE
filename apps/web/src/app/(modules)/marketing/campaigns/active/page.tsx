'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ActivasPage() {
  return (
    <PageTemplate
      title="Activas"
      subtitle="Gestión de activas"
      icon="🟢"
      module="Campañas"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Campaigns', path: '/marketing/campaigns' },
        { label: 'Activas' }
      ]}
    />
  );
}
