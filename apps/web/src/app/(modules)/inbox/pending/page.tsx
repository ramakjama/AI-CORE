'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function InboxPendingPage() {
  return (
    <PageTemplate
      title="Mensajes Pendientes"
      subtitle="Comunicaciones que requieren respuesta"
      icon="⏳"
      module="Bandeja de Entrada"
      breadcrumb={[
        { label: 'Inbox', path: '/inbox' },
        { label: 'Pendientes' }
      ]}
      stats={[
        { label: 'Pendientes', value: 8, change: '3 más de 24h', changeType: 'negative' },
        { label: 'Prioridad Alta', value: 3, changeType: 'negative' },
        { label: 'Prioridad Media', value: 4, changeType: 'neutral' },
        { label: 'Prioridad Baja', value: 1, changeType: 'positive' },
      ]}
    />
  );
}
