'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DGSFPRegulatorioPage() {
  return (
    <PageTemplate
      title="DGSFP / Regulatorio"
      subtitle="Gestión de dgsfp / regulatorio"
      icon="🏛️"
      module="Informes"
      breadcrumb={[
        { label: 'Analytics', path: '/analytics' },
        { label: 'Reports', path: '/analytics/reports' },
        { label: 'DGSFP / Regulatorio' }
      ]}
    />
  );
}
