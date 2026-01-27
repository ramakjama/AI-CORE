'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function LlamadasProgramadasPage() {
  return (
    <PageTemplate
      title="Llamadas Programadas"
      subtitle="Gestión de llamadas programadas"
      icon="📞"
      module="Operativa"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Daily', path: '/operations/daily' },
        { label: 'Llamadas Programadas' }
      ]}
    />
  );
}
