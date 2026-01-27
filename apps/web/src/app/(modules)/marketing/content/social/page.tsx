'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RedesSocialesPage() {
  return (
    <PageTemplate
      title="Redes Sociales"
      subtitle="Gestión de redes sociales"
      icon="📱"
      module="Contenidos"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Content', path: '/marketing/content' },
        { label: 'Redes Sociales' }
      ]}
    />
  );
}
