'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ConversinPage() {
  return (
    <PageTemplate
      title="Conversión"
      subtitle="Gestión de conversión"
      icon="📈"
      module="Leads"
      breadcrumb={[
        { label: 'Leads', path: '/leads' },
        { label: 'Conversión' }
      ]}
    />
  );
}
