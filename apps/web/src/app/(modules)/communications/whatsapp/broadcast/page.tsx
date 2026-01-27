'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DifusinPage() {
  return (
    <PageTemplate
      title="Difusión"
      subtitle="Gestión de difusión"
      icon="📢"
      module="WhatsApp"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Whatsapp', path: '/communications/whatsapp' },
        { label: 'Difusión' }
      ]}
    />
  );
}
