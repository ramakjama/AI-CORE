'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NPSPage() {
  return (
    <PageTemplate
      title="NPS"
      subtitle="Gestión de nps"
      icon="📊"
      module="Calidad"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Quality', path: '/operations/quality' },
        { label: 'NPS' }
      ]}
    />
  );
}
