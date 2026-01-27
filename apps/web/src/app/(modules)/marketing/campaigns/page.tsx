'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CampaasPage() {
  return (
    <PageTemplate
      title="Campañas"
      subtitle="Gestión de campañas"
      icon="📣"
      module="Marketing"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Campañas' }
      ]}
    />
  );
}
