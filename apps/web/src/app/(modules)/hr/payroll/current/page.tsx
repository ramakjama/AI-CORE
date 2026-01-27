'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NminaActualPage() {
  return (
    <PageTemplate
      title="Nómina Actual"
      subtitle="Gestión de nómina actual"
      icon="📄"
      module="Nóminas"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Payroll', path: '/hr/payroll' },
        { label: 'Nómina Actual' }
      ]}
    />
  );
}
