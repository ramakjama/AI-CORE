'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RecompensasPage() {
  return (
    <PageTemplate
      title="Recompensas"
      subtitle="Gestión de recompensas"
      icon="🏆"
      module="Referidos"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Referrals', path: '/marketing/referrals' },
        { label: 'Recompensas' }
      ]}
    />
  );
}
