'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CampaasPage() {
  return (
    <PageTemplate
      title="Campañas"
      subtitle="Gestión de campañas"
      icon="📣"
      module="SMS"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Sms', path: '/communications/sms' },
        { label: 'Campañas' }
      ]}
    />
  );
}
