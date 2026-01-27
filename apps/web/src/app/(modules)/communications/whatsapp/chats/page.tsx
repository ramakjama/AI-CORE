'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ConversacionesPage() {
  return (
    <PageTemplate
      title="Conversaciones"
      subtitle="Gestión de conversaciones"
      icon="💭"
      module="WhatsApp"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Whatsapp', path: '/communications/whatsapp' },
        { label: 'Conversaciones' }
      ]}
    />
  );
}
