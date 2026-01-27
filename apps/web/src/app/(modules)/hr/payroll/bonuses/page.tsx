'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function VariablesPage() {
  return (
    <PageTemplate
      title="Variables"
      subtitle="Gestión de variables"
      icon="💰"
      module="Nóminas"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Payroll', path: '/hr/payroll' },
        { label: 'Variables' }
      ]}
    />
  );
}
