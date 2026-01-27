'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EnviarSMSPage() {
  return (
    <PageTemplate
      title="Enviar SMS"
      subtitle="Gestión de enviar sms"
      icon="📤"
      module="SMS"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Sms', path: '/communications/sms' },
        { label: 'Enviar SMS' }
      ]}
    />
  );
}
