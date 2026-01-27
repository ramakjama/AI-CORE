'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function InboxUrgentPage() {
  return (
    <PageTemplate
      title="Mensajes Urgentes"
      subtitle="Comunicaciones de alta prioridad"
      icon="🚨"
      module="Bandeja de Entrada"
      breadcrumb={[
        { label: 'Inbox', path: '/inbox' },
        { label: 'Urgentes' }
      ]}
      stats={[
        { label: 'Urgentes', value: 4, change: 'Requieren atención inmediata', changeType: 'negative' },
        { label: 'Tiempo Sin Responder', value: '2.5h', change: 'Promedio', changeType: 'negative' },
      ]}
    />
  );
}
