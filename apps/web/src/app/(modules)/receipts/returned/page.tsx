'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DevueltosPage() {
  return (
    <PageTemplate
      title="Devueltos"
      subtitle="Gestión de devueltos"
      icon="↩️"
      module="Recibos"
      breadcrumb={[
        { label: 'Receipts', path: '/receipts' },
        { label: 'Devueltos' }
      ]}
    />
  );
}
