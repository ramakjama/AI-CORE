'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function IRPFPage() {
  return (
    <PageTemplate
      title="IRPF"
      subtitle="Gestión de irpf"
      icon="🏛️"
      module="Nóminas"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Payroll', path: '/hr/payroll' },
        { label: 'IRPF' }
      ]}
    />
  );
}
