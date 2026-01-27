'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function WhatsAppBusinessPage() {
  return (
    <PageTemplate
      title="WhatsApp Business"
      subtitle="Gestión de whatsapp business"
      icon="💬"
      module="Comunicaciones"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'WhatsApp Business' }
      ]}
    />
  );
}
