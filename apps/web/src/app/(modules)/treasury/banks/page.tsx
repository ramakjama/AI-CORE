'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BancosPage() {
  return (
    <PageTemplate
      title="Bancos"
      subtitle="Gestión de bancos"
      icon="🏦"
      module="Tesorería"
      breadcrumb={[
        { label: 'Treasury', path: '/treasury' },
        { label: 'Bancos' }
      ]}
    />
  );
}
