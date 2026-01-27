'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorMediadorPage() {
  return (
    <PageTemplate
      title="Por Mediador"
      subtitle="Gestión de por mediador"
      icon="👤"
      module="Cartera"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Portfolio', path: '/operations/portfolio' },
        { label: 'Por Mediador' }
      ]}
    />
  );
}
