'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevaLandingPage() {
  return (
    <PageTemplate
      title="Nueva Landing"
      subtitle="Gestión de nueva landing"
      icon="➕"
      module="Landing Pages"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Landing', path: '/marketing/landing' },
        { label: 'Nueva Landing' }
      ]}
    />
  );
}
