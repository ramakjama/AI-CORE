'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BackupsPage() {
  return (
    <PageTemplate
      title="Backups"
      subtitle="Gestión de backups"
      icon="💿"
      module="Sistema"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'System', path: '/admin/system' },
        { label: 'Backups' }
      ]}
    />
  );
}
