'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CuotadeMercadoPage() {
  return (
    <PageTemplate
      title="Cuota de Mercado"
      subtitle="Gestión de cuota de mercado"
      icon="📈"
      module="Competencia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Competition', path: '/strategy/competition' },
        { label: 'Cuota de Mercado' }
      ]}
    />
  );
}
