'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SeguimientosPage() {
  return (
    <PageTemplate
      title="Seguimientos"
      subtitle="Gestión de seguimientos"
      icon="🔄"
      module="Operativa"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Daily', path: '/operations/daily' },
        { label: 'Seguimientos' }
      ]}
    />
  );
}
