'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function InboxPage() {
  return (
    <PageTemplate
      title="Bandeja de Entrada"
      subtitle="Gestión centralizada de comunicaciones"
      icon="📥"
      module="Principal"
      stats={[
        { label: 'Total Mensajes', value: 156, change: '+23 hoy', changeType: 'neutral' },
        { label: 'Sin Leer', value: 12, change: '8 nuevos', changeType: 'negative' },
        { label: 'Urgentes', value: 4, change: 'Requieren atención', changeType: 'negative' },
        { label: 'Respondidos Hoy', value: 34, change: '+15% vs ayer', changeType: 'positive' },
      ]}
      actions={
        <>
          <button className="btn-secondary">Filtros</button>
          <button className="btn-primary">Nuevo Mensaje</button>
        </>
      }
    />
  );
}
