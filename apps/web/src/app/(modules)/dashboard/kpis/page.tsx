'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function KPIsPage() {
  return (
    <PageTemplate
      title="KPIs en Tiempo Real"
      subtitle="Indicadores clave de rendimiento del negocio"
      icon="📈"
      module="Dashboard"
      breadcrumb={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'KPIs' }
      ]}
      stats={[
        { label: 'Tasa de Conversión', value: '78%', change: '+5% vs mes anterior', changeType: 'positive' },
        { label: 'Ticket Medio', value: '€1,234', change: '+12% vs mes anterior', changeType: 'positive' },
        { label: 'NPS Score', value: '72', change: '+3 puntos', changeType: 'positive' },
        { label: 'Tiempo Respuesta', value: '2.4h', change: '-15% vs mes anterior', changeType: 'positive' },
      ]}
      actions={
        <>
          <button className="btn-secondary">Configurar KPIs</button>
          <button className="btn-primary">Exportar Informe</button>
        </>
      }
    />
  );
}
