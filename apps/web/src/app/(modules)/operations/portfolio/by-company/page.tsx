'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorCompaaPage() {
  return (
    <PageTemplate
      title="Por Compañía"
      subtitle="Gestión de por compañía"
      icon="🏢"
      module="Cartera"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Portfolio', path: '/operations/portfolio' },
        { label: 'Por Compañía' }
      ]}
    />
  );
}
