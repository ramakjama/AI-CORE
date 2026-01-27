'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CampaasPage() {
  return (
    <PageTemplate
      title="Campañas"
      subtitle="Gestión de campañas"
      icon="📣"
      module="Email"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Email', path: '/communications/email' },
        { label: 'Campañas' }
      ]}
    />
  );
}
