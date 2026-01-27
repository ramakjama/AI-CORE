// ═══════════════════════════════════════════════════════════════════════════
// SORIANO MEDIADORES | ERP NAVIGATION STRUCTURE
// 3-Level Menu System for Enterprise Insurance Brokerage
// ═══════════════════════════════════════════════════════════════════════════

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path?: string;
  badge?: string;
  badgeType?: 'info' | 'warning' | 'success' | 'error';
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const navigationConfig: NavSection[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // CORE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'core',
    title: 'Principal',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: '📊',
        path: '/dashboard',
        children: [
          { id: 'dashboard-overview', label: 'Vista General', icon: '🏠', path: '/dashboard' },
          { id: 'dashboard-kpis', label: 'KPIs en Tiempo Real', icon: '📈', path: '/dashboard/kpis' },
          { id: 'dashboard-alerts', label: 'Alertas', icon: '🔔', path: '/dashboard/alerts', badge: '5', badgeType: 'warning' },
        ]
      },
      {
        id: 'inbox',
        label: 'Bandeja de Entrada',
        icon: '📥',
        path: '/inbox',
        badge: '12',
        badgeType: 'info',
        children: [
          { id: 'inbox-all', label: 'Todas', icon: '📬', path: '/inbox' },
          { id: 'inbox-pending', label: 'Pendientes', icon: '⏳', path: '/inbox/pending', badge: '8', badgeType: 'warning' },
          { id: 'inbox-urgent', label: 'Urgentes', icon: '🚨', path: '/inbox/urgent', badge: '4', badgeType: 'error' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CRM & CLIENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'crm',
    title: 'CRM',
    items: [
      {
        id: 'clients',
        label: 'Clientes',
        icon: '👥',
        path: '/clients',
        children: [
          { id: 'clients-list', label: 'Listado de Clientes', icon: '📋', path: '/clients' },
          { id: 'clients-new', label: 'Nuevo Cliente', icon: '➕', path: '/clients/new' },
          { id: 'clients-import', label: 'Importar Clientes', icon: '📤', path: '/clients/import' },
          { id: 'clients-segments', label: 'Segmentación', icon: '🎯', path: '/clients/segments' },
          { id: 'clients-duplicates', label: 'Duplicados', icon: '🔄', path: '/clients/duplicates' },
        ]
      },
      {
        id: 'leads',
        label: 'Leads y Prospectos',
        icon: '🎯',
        path: '/leads',
        badge: '23',
        badgeType: 'success',
        children: [
          { id: 'leads-pipeline', label: 'Pipeline de Ventas', icon: '📊', path: '/leads/pipeline' },
          { id: 'leads-list', label: 'Listado de Leads', icon: '📋', path: '/leads' },
          { id: 'leads-new', label: 'Nuevo Lead', icon: '➕', path: '/leads/new' },
          { id: 'leads-sources', label: 'Fuentes', icon: '🔗', path: '/leads/sources' },
          { id: 'leads-conversion', label: 'Conversión', icon: '📈', path: '/leads/conversion' },
        ]
      },
      {
        id: 'contacts',
        label: 'Contactos',
        icon: '📇',
        path: '/contacts',
        children: [
          { id: 'contacts-list', label: 'Directorio', icon: '📖', path: '/contacts' },
          { id: 'contacts-new', label: 'Nuevo Contacto', icon: '➕', path: '/contacts/new' },
          { id: 'contacts-groups', label: 'Grupos', icon: '👥', path: '/contacts/groups' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INSURANCE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'insurance',
    title: 'Seguros',
    items: [
      {
        id: 'policies',
        label: 'Pólizas',
        icon: '📋',
        path: '/policies',
        children: [
          { id: 'policies-all', label: 'Cartera Completa', icon: '📁', path: '/policies' },
          { id: 'policies-new', label: 'Nueva Póliza', icon: '➕', path: '/policies/new' },
          { id: 'policies-quotes', label: 'Cotizador', icon: '💰', path: '/policies/quotes' },
          { id: 'policies-company', label: 'Por Compañía', icon: '🏢', path: '/policies/by-company' },
          { id: 'policies-branch', label: 'Por Ramo', icon: '📂', path: '/policies/by-branch' },
          { id: 'policies-supplements', label: 'Suplementos', icon: '📝', path: '/policies/supplements' },
        ]
      },
      {
        id: 'renewals',
        label: 'Vencimientos',
        icon: '📅',
        path: '/renewals',
        badge: '47',
        badgeType: 'warning',
        children: [
          { id: 'renewals-upcoming', label: 'Próximos 30 días', icon: '⏰', path: '/renewals/upcoming', badge: '47', badgeType: 'warning' },
          { id: 'renewals-pending', label: 'Renovaciones Pendientes', icon: '🔄', path: '/renewals/pending' },
          { id: 'renewals-calendar', label: 'Calendario', icon: '📆', path: '/renewals/calendar' },
          { id: 'renewals-auto', label: 'Renovación Automática', icon: '⚡', path: '/renewals/auto' },
        ]
      },
      {
        id: 'claims',
        label: 'Siniestros',
        icon: '📈',
        path: '/claims',
        badge: '8',
        badgeType: 'error',
        children: [
          { id: 'claims-open', label: 'Siniestros Abiertos', icon: '🔓', path: '/claims/open', badge: '8', badgeType: 'error' },
          { id: 'claims-new', label: 'Nuevo Siniestro', icon: '➕', path: '/claims/new' },
          { id: 'claims-tracking', label: 'Seguimiento', icon: '👁️', path: '/claims/tracking' },
          { id: 'claims-closed', label: 'Siniestros Cerrados', icon: '🔒', path: '/claims/closed' },
          { id: 'claims-experts', label: 'Peritajes', icon: '🔍', path: '/claims/experts' },
          { id: 'claims-payments', label: 'Indemnizaciones', icon: '💳', path: '/claims/payments' },
        ]
      },
      {
        id: 'receipts',
        label: 'Recibos',
        icon: '🧾',
        path: '/receipts',
        children: [
          { id: 'receipts-pending', label: 'Pendientes de Cobro', icon: '⏳', path: '/receipts/pending' },
          { id: 'receipts-paid', label: 'Cobrados', icon: '✅', path: '/receipts/paid' },
          { id: 'receipts-returned', label: 'Devueltos', icon: '↩️', path: '/receipts/returned' },
          { id: 'receipts-remittances', label: 'Remesas', icon: '📦', path: '/receipts/remittances' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FINANCE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'finance',
    title: 'Finanzas',
    items: [
      {
        id: 'commissions',
        label: 'Comisiones',
        icon: '💰',
        path: '/commissions',
        children: [
          { id: 'commissions-pending', label: 'Pendientes de Cobro', icon: '⏳', path: '/commissions/pending' },
          { id: 'commissions-collected', label: 'Cobradas', icon: '✅', path: '/commissions/collected' },
          { id: 'commissions-reconciliation', label: 'Reconciliación', icon: '🔄', path: '/commissions/reconciliation' },
          { id: 'commissions-by-company', label: 'Por Compañía', icon: '🏢', path: '/commissions/by-company' },
          { id: 'commissions-by-agent', label: 'Por Mediador', icon: '👤', path: '/commissions/by-agent' },
          { id: 'commissions-rappels', label: 'Rappels', icon: '🎁', path: '/commissions/rappels' },
        ]
      },
      {
        id: 'accounting',
        label: 'Contabilidad',
        icon: '📒',
        path: '/accounting',
        children: [
          { id: 'accounting-journal', label: 'Libro Diario', icon: '📖', path: '/accounting/journal' },
          { id: 'accounting-ledger', label: 'Libro Mayor', icon: '📚', path: '/accounting/ledger' },
          { id: 'accounting-invoices', label: 'Facturas', icon: '🧾', path: '/accounting/invoices' },
          { id: 'accounting-expenses', label: 'Gastos', icon: '💸', path: '/accounting/expenses' },
          { id: 'accounting-taxes', label: 'Impuestos', icon: '🏛️', path: '/accounting/taxes' },
        ]
      },
      {
        id: 'treasury',
        label: 'Tesorería',
        icon: '🏦',
        path: '/treasury',
        children: [
          { id: 'treasury-cash', label: 'Caja', icon: '💵', path: '/treasury/cash' },
          { id: 'treasury-banks', label: 'Bancos', icon: '🏦', path: '/treasury/banks' },
          { id: 'treasury-payments', label: 'Pagos', icon: '💳', path: '/treasury/payments' },
          { id: 'treasury-forecasts', label: 'Previsiones', icon: '📊', path: '/treasury/forecasts' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMUNICATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'communications',
    title: 'Comunicaciones',
    items: [
      {
        id: 'email',
        label: 'Email',
        icon: '✉️',
        path: '/communications/email',
        badge: '3',
        badgeType: 'info',
        children: [
          { id: 'email-inbox', label: 'Bandeja de Entrada', icon: '📥', path: '/communications/email/inbox', badge: '3', badgeType: 'info' },
          { id: 'email-sent', label: 'Enviados', icon: '📤', path: '/communications/email/sent' },
          { id: 'email-drafts', label: 'Borradores', icon: '📝', path: '/communications/email/drafts' },
          { id: 'email-templates', label: 'Plantillas', icon: '📄', path: '/communications/email/templates' },
          { id: 'email-campaigns', label: 'Campañas', icon: '📣', path: '/communications/email/campaigns' },
        ]
      },
      {
        id: 'sms',
        label: 'SMS',
        icon: '📱',
        path: '/communications/sms',
        children: [
          { id: 'sms-send', label: 'Enviar SMS', icon: '📤', path: '/communications/sms/send' },
          { id: 'sms-history', label: 'Historial', icon: '📋', path: '/communications/sms/history' },
          { id: 'sms-campaigns', label: 'Campañas', icon: '📣', path: '/communications/sms/campaigns' },
          { id: 'sms-templates', label: 'Plantillas', icon: '📄', path: '/communications/sms/templates' },
        ]
      },
      {
        id: 'whatsapp',
        label: 'WhatsApp Business',
        icon: '💬',
        path: '/communications/whatsapp',
        children: [
          { id: 'whatsapp-chats', label: 'Conversaciones', icon: '💭', path: '/communications/whatsapp/chats' },
          { id: 'whatsapp-broadcast', label: 'Difusión', icon: '📢', path: '/communications/whatsapp/broadcast' },
          { id: 'whatsapp-templates', label: 'Plantillas', icon: '📄', path: '/communications/whatsapp/templates' },
          { id: 'whatsapp-automations', label: 'Automatizaciones', icon: '🤖', path: '/communications/whatsapp/automations' },
        ]
      },
      {
        id: 'calls',
        label: 'Teléfono',
        icon: '📞',
        path: '/communications/calls',
        children: [
          { id: 'calls-history', label: 'Historial de Llamadas', icon: '📋', path: '/communications/calls/history' },
          { id: 'calls-recordings', label: 'Grabaciones', icon: '🎙️', path: '/communications/calls/recordings' },
          { id: 'calls-schedule', label: 'Programar Llamada', icon: '📅', path: '/communications/calls/schedule' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DOCUMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'documents',
    title: 'Documentos',
    items: [
      {
        id: 'archive',
        label: 'Archivo Digital',
        icon: '📁',
        path: '/documents',
        children: [
          { id: 'archive-all', label: 'Todos los Documentos', icon: '📂', path: '/documents' },
          { id: 'archive-client', label: 'Por Cliente', icon: '👤', path: '/documents/by-client' },
          { id: 'archive-policy', label: 'Por Póliza', icon: '📋', path: '/documents/by-policy' },
          { id: 'archive-claim', label: 'Por Siniestro', icon: '📈', path: '/documents/by-claim' },
          { id: 'archive-upload', label: 'Subir Documento', icon: '⬆️', path: '/documents/upload' },
        ]
      },
      {
        id: 'templates',
        label: 'Plantillas',
        icon: '📄',
        path: '/documents/templates',
        children: [
          { id: 'templates-letters', label: 'Cartas', icon: '✉️', path: '/documents/templates/letters' },
          { id: 'templates-contracts', label: 'Contratos', icon: '📜', path: '/documents/templates/contracts' },
          { id: 'templates-forms', label: 'Formularios', icon: '📝', path: '/documents/templates/forms' },
          { id: 'templates-reports', label: 'Informes', icon: '📊', path: '/documents/templates/reports' },
        ]
      },
      {
        id: 'signatures',
        label: 'Firma Digital',
        icon: '✍️',
        path: '/documents/signatures',
        badge: '2',
        badgeType: 'warning',
        children: [
          { id: 'signatures-pending', label: 'Pendientes de Firma', icon: '⏳', path: '/documents/signatures/pending', badge: '2', badgeType: 'warning' },
          { id: 'signatures-signed', label: 'Firmados', icon: '✅', path: '/documents/signatures/signed' },
          { id: 'signatures-request', label: 'Solicitar Firma', icon: '📤', path: '/documents/signatures/request' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AI & AUTOMATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'ai',
    title: 'Inteligencia Artificial',
    items: [
      {
        id: 'ai-agents',
        label: 'Agentes IA',
        icon: '🤖',
        path: '/ai/agents',
        children: [
          { id: 'ai-agents-sales', label: 'Asistente de Ventas', icon: '💼', path: '/ai/agents/sales' },
          { id: 'ai-agents-risk', label: 'Análisis de Riesgos', icon: '⚠️', path: '/ai/agents/risk' },
          { id: 'ai-agents-support', label: 'Atención al Cliente', icon: '🎧', path: '/ai/agents/support' },
          { id: 'ai-agents-docs', label: 'Procesamiento de Docs', icon: '📄', path: '/ai/agents/docs' },
          { id: 'ai-agents-config', label: 'Configuración', icon: '⚙️', path: '/ai/agents/config' },
        ]
      },
      {
        id: 'automations',
        label: 'Automatizaciones',
        icon: '⚡',
        path: '/ai/automations',
        children: [
          { id: 'automations-workflows', label: 'Workflows', icon: '🔄', path: '/ai/automations/workflows' },
          { id: 'automations-rules', label: 'Reglas de Negocio', icon: '📏', path: '/ai/automations/rules' },
          { id: 'automations-triggers', label: 'Triggers', icon: '🎯', path: '/ai/automations/triggers' },
          { id: 'automations-schedules', label: 'Programaciones', icon: '📅', path: '/ai/automations/schedules' },
          { id: 'automations-logs', label: 'Historial', icon: '📋', path: '/ai/automations/logs' },
        ]
      },
      {
        id: 'predictive',
        label: 'Analytics Predictivo',
        icon: '🔮',
        path: '/ai/predictive',
        children: [
          { id: 'predictive-churn', label: 'Predicción de Bajas', icon: '📉', path: '/ai/predictive/churn' },
          { id: 'predictive-upsell', label: 'Oportunidades Venta', icon: '📈', path: '/ai/predictive/upsell' },
          { id: 'predictive-scoring', label: 'Scoring de Clientes', icon: '⭐', path: '/ai/predictive/scoring' },
          { id: 'predictive-claims', label: 'Predicción Siniestros', icon: '🎲', path: '/ai/predictive/claims' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ANALYTICS & REPORTS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'analytics',
    title: 'Analytics',
    items: [
      {
        id: 'dashboards',
        label: 'Dashboards',
        icon: '📊',
        path: '/analytics/dashboards',
        children: [
          { id: 'dashboards-production', label: 'Producción', icon: '🏭', path: '/analytics/dashboards/production' },
          { id: 'dashboards-portfolio', label: 'Cartera', icon: '💼', path: '/analytics/dashboards/portfolio' },
          { id: 'dashboards-claims', label: 'Siniestralidad', icon: '📈', path: '/analytics/dashboards/claims' },
          { id: 'dashboards-sales', label: 'Ventas', icon: '💰', path: '/analytics/dashboards/sales' },
          { id: 'dashboards-custom', label: 'Personalizado', icon: '🎨', path: '/analytics/dashboards/custom' },
        ]
      },
      {
        id: 'reports',
        label: 'Informes',
        icon: '📑',
        path: '/analytics/reports',
        children: [
          { id: 'reports-standard', label: 'Estándar', icon: '📄', path: '/analytics/reports/standard' },
          { id: 'reports-custom', label: 'Personalizados', icon: '🎨', path: '/analytics/reports/custom' },
          { id: 'reports-scheduled', label: 'Programados', icon: '📅', path: '/analytics/reports/scheduled' },
          { id: 'reports-dgsfp', label: 'DGSFP / Regulatorio', icon: '🏛️', path: '/analytics/reports/dgsfp' },
        ]
      },
      {
        id: 'metrics',
        label: 'Métricas',
        icon: '📏',
        path: '/analytics/metrics',
        children: [
          { id: 'metrics-kpis', label: 'KPIs', icon: '🎯', path: '/analytics/metrics/kpis' },
          { id: 'metrics-objectives', label: 'Objetivos', icon: '🏆', path: '/analytics/metrics/objectives' },
          { id: 'metrics-comparison', label: 'Comparativas', icon: '⚖️', path: '/analytics/metrics/comparison' },
          { id: 'metrics-trends', label: 'Tendencias', icon: '📈', path: '/analytics/metrics/trends' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DAILY OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'operations',
    title: 'Operaciones',
    items: [
      {
        id: 'daily',
        label: 'Operativa Diaria',
        icon: '📆',
        path: '/operations/daily',
        children: [
          { id: 'daily-tasks', label: 'Tareas del Día', icon: '✅', path: '/operations/daily/tasks', badge: '12', badgeType: 'info' },
          { id: 'daily-agenda', label: 'Agenda', icon: '📅', path: '/operations/daily/agenda' },
          { id: 'daily-calls', label: 'Llamadas Programadas', icon: '📞', path: '/operations/daily/calls' },
          { id: 'daily-visits', label: 'Visitas', icon: '🚗', path: '/operations/daily/visits' },
          { id: 'daily-followups', label: 'Seguimientos', icon: '🔄', path: '/operations/daily/followups' },
        ]
      },
      {
        id: 'production',
        label: 'Producción',
        icon: '📊',
        path: '/operations/production',
        children: [
          { id: 'production-new', label: 'Nueva Producción', icon: '➕', path: '/operations/production/new' },
          { id: 'production-pending', label: 'Pendiente Emisión', icon: '⏳', path: '/operations/production/pending' },
          { id: 'production-issued', label: 'Emitida', icon: '✅', path: '/operations/production/issued' },
          { id: 'production-cancelled', label: 'Anulaciones', icon: '❌', path: '/operations/production/cancelled' },
        ]
      },
      {
        id: 'portfolio',
        label: 'Cartera',
        icon: '💼',
        path: '/operations/portfolio',
        children: [
          { id: 'portfolio-overview', label: 'Resumen Cartera', icon: '📈', path: '/operations/portfolio' },
          { id: 'portfolio-by-mediator', label: 'Por Mediador', icon: '👤', path: '/operations/portfolio/by-mediator' },
          { id: 'portfolio-by-company', label: 'Por Compañía', icon: '🏢', path: '/operations/portfolio/by-company' },
          { id: 'portfolio-evolution', label: 'Evolución', icon: '📊', path: '/operations/portfolio/evolution' },
        ]
      },
      {
        id: 'quality',
        label: 'Calidad',
        icon: '⭐',
        path: '/operations/quality',
        children: [
          { id: 'quality-surveys', label: 'Encuestas', icon: '📝', path: '/operations/quality/surveys' },
          { id: 'quality-complaints', label: 'Reclamaciones', icon: '⚠️', path: '/operations/quality/complaints' },
          { id: 'quality-nps', label: 'NPS', icon: '📊', path: '/operations/quality/nps' },
          { id: 'quality-reviews', label: 'Reseñas', icon: '💬', path: '/operations/quality/reviews' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HUMAN RESOURCES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'hr',
    title: 'Recursos Humanos',
    items: [
      {
        id: 'employees',
        label: 'Empleados',
        icon: '👥',
        path: '/hr/employees',
        children: [
          { id: 'employees-list', label: 'Plantilla', icon: '📋', path: '/hr/employees' },
          { id: 'employees-new', label: 'Alta Empleado', icon: '➕', path: '/hr/employees/new' },
          { id: 'employees-contracts', label: 'Contratos', icon: '📜', path: '/hr/employees/contracts' },
          { id: 'employees-organigram', label: 'Organigrama', icon: '🏛️', path: '/hr/employees/organigram' },
        ]
      },
      {
        id: 'attendance',
        label: 'Control Horario',
        icon: '⏰',
        path: '/hr/attendance',
        children: [
          { id: 'attendance-clock', label: 'Fichajes', icon: '🕐', path: '/hr/attendance/clock' },
          { id: 'attendance-calendar', label: 'Calendario', icon: '📅', path: '/hr/attendance/calendar' },
          { id: 'attendance-absences', label: 'Ausencias', icon: '🚫', path: '/hr/attendance/absences' },
          { id: 'attendance-overtime', label: 'Horas Extra', icon: '⏱️', path: '/hr/attendance/overtime' },
        ]
      },
      {
        id: 'vacations',
        label: 'Vacaciones',
        icon: '🏖️',
        path: '/hr/vacations',
        children: [
          { id: 'vacations-requests', label: 'Solicitudes', icon: '📝', path: '/hr/vacations/requests' },
          { id: 'vacations-calendar', label: 'Calendario', icon: '📅', path: '/hr/vacations/calendar' },
          { id: 'vacations-balance', label: 'Saldos', icon: '📊', path: '/hr/vacations/balance' },
        ]
      },
      {
        id: 'payroll',
        label: 'Nóminas',
        icon: '💵',
        path: '/hr/payroll',
        children: [
          { id: 'payroll-current', label: 'Nómina Actual', icon: '📄', path: '/hr/payroll/current' },
          { id: 'payroll-history', label: 'Histórico', icon: '📚', path: '/hr/payroll/history' },
          { id: 'payroll-bonuses', label: 'Variables', icon: '💰', path: '/hr/payroll/bonuses' },
          { id: 'payroll-irpf', label: 'IRPF', icon: '🏛️', path: '/hr/payroll/irpf' },
        ]
      },
      {
        id: 'recruitment',
        label: 'Selección',
        icon: '🎯',
        path: '/hr/recruitment',
        children: [
          { id: 'recruitment-jobs', label: 'Ofertas', icon: '📢', path: '/hr/recruitment/jobs' },
          { id: 'recruitment-candidates', label: 'Candidatos', icon: '👤', path: '/hr/recruitment/candidates' },
          { id: 'recruitment-interviews', label: 'Entrevistas', icon: '🤝', path: '/hr/recruitment/interviews' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACADEMY & TRAINING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'academy',
    title: 'Academia',
    items: [
      {
        id: 'courses',
        label: 'Cursos',
        icon: '🎓',
        path: '/academy/courses',
        children: [
          { id: 'courses-catalog', label: 'Catálogo', icon: '📚', path: '/academy/courses' },
          { id: 'courses-my', label: 'Mis Cursos', icon: '📖', path: '/academy/courses/my' },
          { id: 'courses-progress', label: 'Mi Progreso', icon: '📈', path: '/academy/courses/progress' },
          { id: 'courses-certificates', label: 'Certificados', icon: '🏆', path: '/academy/courses/certificates' },
        ]
      },
      {
        id: 'training',
        label: 'Formación',
        icon: '📝',
        path: '/academy/training',
        children: [
          { id: 'training-dgsfp', label: 'DGSFP Obligatoria', icon: '🏛️', path: '/academy/training/dgsfp' },
          { id: 'training-products', label: 'Productos', icon: '📦', path: '/academy/training/products' },
          { id: 'training-skills', label: 'Habilidades', icon: '💪', path: '/academy/training/skills' },
          { id: 'training-compliance', label: 'Compliance', icon: '⚖️', path: '/academy/training/compliance' },
        ]
      },
      {
        id: 'knowledge',
        label: 'Base de Conocimiento',
        icon: '📖',
        path: '/academy/knowledge',
        children: [
          { id: 'knowledge-wiki', label: 'Wiki Interna', icon: '📄', path: '/academy/knowledge/wiki' },
          { id: 'knowledge-procedures', label: 'Procedimientos', icon: '📋', path: '/academy/knowledge/procedures' },
          { id: 'knowledge-faq', label: 'FAQ', icon: '❓', path: '/academy/knowledge/faq' },
          { id: 'knowledge-videos', label: 'Videoteca', icon: '🎬', path: '/academy/knowledge/videos' },
        ]
      },
      {
        id: 'exams',
        label: 'Evaluaciones',
        icon: '📝',
        path: '/academy/exams',
        children: [
          { id: 'exams-pending', label: 'Pendientes', icon: '⏳', path: '/academy/exams/pending' },
          { id: 'exams-completed', label: 'Completados', icon: '✅', path: '/academy/exams/completed' },
          { id: 'exams-results', label: 'Resultados', icon: '📊', path: '/academy/exams/results' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MARKETING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'marketing',
    title: 'Marketing',
    items: [
      {
        id: 'campaigns',
        label: 'Campañas',
        icon: '📣',
        path: '/marketing/campaigns',
        children: [
          { id: 'campaigns-active', label: 'Activas', icon: '🟢', path: '/marketing/campaigns/active' },
          { id: 'campaigns-new', label: 'Nueva Campaña', icon: '➕', path: '/marketing/campaigns/new' },
          { id: 'campaigns-scheduled', label: 'Programadas', icon: '📅', path: '/marketing/campaigns/scheduled' },
          { id: 'campaigns-completed', label: 'Finalizadas', icon: '✅', path: '/marketing/campaigns/completed' },
          { id: 'campaigns-results', label: 'Resultados', icon: '📊', path: '/marketing/campaigns/results' },
        ]
      },
      {
        id: 'content',
        label: 'Contenidos',
        icon: '📝',
        path: '/marketing/content',
        children: [
          { id: 'content-blog', label: 'Blog', icon: '📰', path: '/marketing/content/blog' },
          { id: 'content-social', label: 'Redes Sociales', icon: '📱', path: '/marketing/content/social' },
          { id: 'content-newsletter', label: 'Newsletter', icon: '✉️', path: '/marketing/content/newsletter' },
          { id: 'content-media', label: 'Banco de Medios', icon: '🖼️', path: '/marketing/content/media' },
        ]
      },
      {
        id: 'landing',
        label: 'Landing Pages',
        icon: '🌐',
        path: '/marketing/landing',
        children: [
          { id: 'landing-pages', label: 'Páginas', icon: '📄', path: '/marketing/landing' },
          { id: 'landing-new', label: 'Nueva Landing', icon: '➕', path: '/marketing/landing/new' },
          { id: 'landing-ab', label: 'Test A/B', icon: '🔬', path: '/marketing/landing/ab' },
          { id: 'landing-conversions', label: 'Conversiones', icon: '📈', path: '/marketing/landing/conversions' },
        ]
      },
      {
        id: 'seo',
        label: 'SEO / SEM',
        icon: '🔍',
        path: '/marketing/seo',
        children: [
          { id: 'seo-keywords', label: 'Palabras Clave', icon: '🔑', path: '/marketing/seo/keywords' },
          { id: 'seo-rankings', label: 'Rankings', icon: '📊', path: '/marketing/seo/rankings' },
          { id: 'seo-ads', label: 'Google Ads', icon: '💰', path: '/marketing/seo/ads' },
          { id: 'seo-analytics', label: 'Analytics', icon: '📈', path: '/marketing/seo/analytics' },
        ]
      },
      {
        id: 'referrals',
        label: 'Referidos',
        icon: '🤝',
        path: '/marketing/referrals',
        children: [
          { id: 'referrals-program', label: 'Programa', icon: '🎁', path: '/marketing/referrals/program' },
          { id: 'referrals-list', label: 'Referidos', icon: '📋', path: '/marketing/referrals' },
          { id: 'referrals-rewards', label: 'Recompensas', icon: '🏆', path: '/marketing/referrals/rewards' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STRATEGY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'strategy',
    title: 'Estrategia',
    items: [
      {
        id: 'analysis',
        label: 'Análisis Estratégico',
        icon: '🎯',
        path: '/strategy/analysis',
        children: [
          { id: 'analysis-pestel', label: 'PESTEL', icon: '🌍', path: '/strategy/analysis/pestel' },
          { id: 'analysis-porter', label: 'Porter 5 Fuerzas', icon: '⚔️', path: '/strategy/analysis/porter' },
          { id: 'analysis-dafo', label: 'DAFO / SWOT', icon: '📊', path: '/strategy/analysis/dafo' },
          { id: 'analysis-came', label: 'CAME', icon: '🔄', path: '/strategy/analysis/came' },
        ]
      },
      {
        id: 'competition',
        label: 'Competencia',
        icon: '🏆',
        path: '/strategy/competition',
        children: [
          { id: 'competition-local', label: 'Local', icon: '📍', path: '/strategy/competition/local' },
          { id: 'competition-regional', label: 'Regional', icon: '🗺️', path: '/strategy/competition/regional' },
          { id: 'competition-online', label: 'Online', icon: '🌐', path: '/strategy/competition/online' },
          { id: 'competition-market-share', label: 'Cuota de Mercado', icon: '📈', path: '/strategy/competition/market-share' },
        ]
      },
      {
        id: 'planning',
        label: 'Planificación',
        icon: '📋',
        path: '/strategy/planning',
        children: [
          { id: 'planning-objectives', label: 'Objetivos', icon: '🎯', path: '/strategy/planning/objectives' },
          { id: 'planning-tactics', label: 'Tácticas', icon: '♟️', path: '/strategy/planning/tactics' },
          { id: 'planning-kpis', label: 'KPIs Estratégicos', icon: '📊', path: '/strategy/planning/kpis' },
          { id: 'planning-timeline', label: 'Cronograma', icon: '📅', path: '/strategy/planning/timeline' },
        ]
      },
      {
        id: 'execution',
        label: 'Ejecución',
        icon: '🚀',
        path: '/strategy/execution',
        children: [
          { id: 'execution-actions', label: 'Plan de Acción', icon: '✅', path: '/strategy/execution/actions' },
          { id: 'execution-tracking', label: 'Seguimiento', icon: '👁️', path: '/strategy/execution/tracking' },
          { id: 'execution-results', label: 'Resultados', icon: '📈', path: '/strategy/execution/results' },
        ]
      },
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMINISTRATION
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'admin',
    title: 'Administración',
    items: [
      {
        id: 'users',
        label: 'Usuarios',
        icon: '👤',
        path: '/admin/users',
        children: [
          { id: 'users-list', label: 'Gestión de Usuarios', icon: '👥', path: '/admin/users' },
          { id: 'users-new', label: 'Nuevo Usuario', icon: '➕', path: '/admin/users/new' },
          { id: 'users-roles', label: 'Roles y Permisos', icon: '🔐', path: '/admin/users/roles' },
          { id: 'users-activity', label: 'Actividad', icon: '📋', path: '/admin/users/activity' },
          { id: 'users-teams', label: 'Equipos', icon: '👥', path: '/admin/users/teams' },
        ]
      },
      {
        id: 'companies',
        label: 'Compañías',
        icon: '🏢',
        path: '/admin/companies',
        children: [
          { id: 'companies-insurers', label: 'Aseguradoras', icon: '🏛️', path: '/admin/companies/insurers' },
          { id: 'companies-products', label: 'Productos', icon: '📦', path: '/admin/companies/products' },
          { id: 'companies-rates', label: 'Tarifas', icon: '💵', path: '/admin/companies/rates' },
          { id: 'companies-contacts', label: 'Contactos', icon: '📇', path: '/admin/companies/contacts' },
        ]
      },
      {
        id: 'settings',
        label: 'Configuración',
        icon: '⚙️',
        path: '/admin/settings',
        children: [
          { id: 'settings-general', label: 'General', icon: '🔧', path: '/admin/settings/general' },
          { id: 'settings-branding', label: 'Personalización', icon: '🎨', path: '/admin/settings/branding' },
          { id: 'settings-integrations', label: 'Integraciones', icon: '🔗', path: '/admin/settings/integrations' },
          { id: 'settings-notifications', label: 'Notificaciones', icon: '🔔', path: '/admin/settings/notifications' },
          { id: 'settings-security', label: 'Seguridad', icon: '🔒', path: '/admin/settings/security' },
        ]
      },
      {
        id: 'system',
        label: 'Sistema',
        icon: '🖥️',
        path: '/admin/system',
        children: [
          { id: 'system-databases', label: 'Bases de Datos (81)', icon: '💾', path: '/admin/system/databases' },
          { id: 'system-logs', label: 'Logs', icon: '📋', path: '/admin/system/logs' },
          { id: 'system-backups', label: 'Backups', icon: '💿', path: '/admin/system/backups' },
          { id: 'system-health', label: 'Estado del Sistema', icon: '❤️', path: '/admin/system/health' },
          { id: 'system-updates', label: 'Actualizaciones', icon: '🔄', path: '/admin/system/updates' },
        ]
      },
    ]
  },
];

// Quick access shortcuts for the dashboard
export const quickActions = [
  { id: 'new-policy', label: 'Nueva Póliza', icon: '📋', path: '/policies/new', color: '#E30613' },
  { id: 'new-client', label: 'Nuevo Cliente', icon: '👤', path: '/clients/new', color: '#007AFF' },
  { id: 'new-claim', label: 'Nuevo Siniestro', icon: '📈', path: '/claims/new', color: '#FF9500' },
  { id: 'new-quote', label: 'Cotizar', icon: '💰', path: '/policies/quotes', color: '#34C759' },
  { id: 'send-email', label: 'Enviar Email', icon: '✉️', path: '/communications/email/compose', color: '#5856D6' },
  { id: 'ai-assistant', label: 'Asistente IA', icon: '🤖', path: '/ai/agents/support', color: '#FF2D55' },
];

// User menu items
export const userMenuItems = [
  { id: 'profile', label: 'Mi Perfil', icon: '👤', path: '/profile' },
  { id: 'preferences', label: 'Preferencias', icon: '⚙️', path: '/preferences' },
  { id: 'notifications', label: 'Notificaciones', icon: '🔔', path: '/notifications' },
  { id: 'help', label: 'Ayuda', icon: '❓', path: '/help' },
  { id: 'logout', label: 'Cerrar Sesión', icon: '🚪', path: '/logout' },
];

// Stats for the sidebar footer
export const systemStats = {
  databases: 81,
  aiAgents: 7,
  activeUsers: 12,
  uptime: '99.9%',
};
