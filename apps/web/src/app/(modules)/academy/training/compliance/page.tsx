'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompliancePage() {
  return (
    <PageTemplate
      title="Compliance"
      subtitle="Gestión de compliance"
      icon="⚖️"
      module="Formación"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Training', path: '/academy/training' },
        { label: 'Compliance' }
      ]}
    />
  );
}
