'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SegmentacinPage() {
  return (
    <PageTemplate
      title="Segmentación"
      subtitle="Gestión de segmentación"
      icon="🎯"
      module="Clientes"
      breadcrumb={[
        { label: 'Clients', path: '/clients' },
        { label: 'Segmentación' }
      ]}
    />
  );
}
