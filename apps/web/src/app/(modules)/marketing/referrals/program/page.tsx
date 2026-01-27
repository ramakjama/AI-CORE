'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProgramaPage() {
  return (
    <PageTemplate
      title="Programa"
      subtitle="Gestión de programa"
      icon="🎁"
      module="Referidos"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Referrals', path: '/marketing/referrals' },
        { label: 'Programa' }
      ]}
    />
  );
}
