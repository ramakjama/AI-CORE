'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DGSFPObligatoriaPage() {
  return (
    <PageTemplate
      title="DGSFP Obligatoria"
      subtitle="Gestión de dgsfp obligatoria"
      icon="🏛️"
      module="Formación"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Training', path: '/academy/training' },
        { label: 'DGSFP Obligatoria' }
      ]}
    />
  );
}
