'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EmitidaPage() {
  return (
    <PageTemplate
      title="Emitida"
      subtitle="Gestión de emitida"
      icon="✅"
      module="Producción"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Production', path: '/operations/production' },
        { label: 'Emitida' }
      ]}
    />
  );
}
