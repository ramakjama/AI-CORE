'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AlertsPage() {
  return (
    <PageTemplate
      title="Alertas del Sistema"
      subtitle="Notificaciones y alertas importantes"
      icon="🔔"
      module="Dashboard"
      breadcrumb={[
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Alertas' }
      ]}
      stats={[
        { label: 'Alertas Activas', value: 5, change: '2 urgentes', changeType: 'negative' },
        { label: 'Resueltas Hoy', value: 12, change: '+8 vs ayer', changeType: 'positive' },
        { label: 'Pendientes', value: 8, change: '3 críticas', changeType: 'negative' },
        { label: 'Tiempo Medio Resolución', value: '1.5h', changeType: 'neutral' },
      ]}
      actions={
        <>
          <button className="btn-secondary">Configurar Alertas</button>
          <button className="btn-primary">Marcar Todas Leídas</button>
        </>
      }
    />
  );
}
