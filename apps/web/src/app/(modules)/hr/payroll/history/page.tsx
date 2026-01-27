'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function HistricoPage() {
  return (
    <PageTemplate
      title="Histórico"
      subtitle="Gestión de histórico"
      icon="📚"
      module="Nóminas"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Payroll', path: '/hr/payroll' },
        { label: 'Histórico' }
      ]}
    />
  );
}
