'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SMSPage() {
  return (
    <PageTemplate
      title="SMS"
      subtitle="Gestión de sms"
      icon="📱"
      module="Comunicaciones"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'SMS' }
      ]}
    />
  );
}
