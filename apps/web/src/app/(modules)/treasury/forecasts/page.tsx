'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PrevisionesPage() {
  return (
    <PageTemplate
      title="Previsiones"
      subtitle="Gestión de previsiones"
      icon="📊"
      module="Tesorería"
      breadcrumb={[
        { label: 'Treasury', path: '/treasury' },
        { label: 'Previsiones' }
      ]}
    />
  );
}
