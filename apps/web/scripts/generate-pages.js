const fs = require('fs');
const path = require('path');

// Page configuration extracted from navigation
const pages = [
  // Core
  { path: '/dashboard/kpis', title: 'KPIs en Tiempo Real', icon: '📈', module: 'Dashboard' },
  { path: '/dashboard/alerts', title: 'Alertas', icon: '🔔', module: 'Dashboard' },
  { path: '/inbox', title: 'Bandeja de Entrada', icon: '📥', module: 'Principal' },
  { path: '/inbox/pending', title: 'Mensajes Pendientes', icon: '⏳', module: 'Inbox' },
  { path: '/inbox/urgent', title: 'Mensajes Urgentes', icon: '🚨', module: 'Inbox' },

  // CRM - Clients
  { path: '/clients', title: 'Clientes', icon: '👥', module: 'CRM' },
  { path: '/clients/new', title: 'Nuevo Cliente', icon: '➕', module: 'Clientes' },
  { path: '/clients/import', title: 'Importar Clientes', icon: '📤', module: 'Clientes' },
  { path: '/clients/segments', title: 'Segmentación', icon: '🎯', module: 'Clientes' },
  { path: '/clients/duplicates', title: 'Duplicados', icon: '🔄', module: 'Clientes' },

  // CRM - Leads
  { path: '/leads', title: 'Leads y Prospectos', icon: '🎯', module: 'CRM' },
  { path: '/leads/pipeline', title: 'Pipeline de Ventas', icon: '📊', module: 'Leads' },
  { path: '/leads/new', title: 'Nuevo Lead', icon: '➕', module: 'Leads' },
  { path: '/leads/sources', title: 'Fuentes', icon: '🔗', module: 'Leads' },
  { path: '/leads/conversion', title: 'Conversión', icon: '📈', module: 'Leads' },

  // CRM - Contacts
  { path: '/contacts', title: 'Contactos', icon: '📇', module: 'CRM' },
  { path: '/contacts/new', title: 'Nuevo Contacto', icon: '➕', module: 'Contactos' },
  { path: '/contacts/groups', title: 'Grupos', icon: '👥', module: 'Contactos' },

  // Insurance - Policies
  { path: '/policies', title: 'Pólizas', icon: '📋', module: 'Seguros' },
  { path: '/policies/new', title: 'Nueva Póliza', icon: '➕', module: 'Pólizas' },
  { path: '/policies/quotes', title: 'Cotizador', icon: '💰', module: 'Pólizas' },
  { path: '/policies/by-company', title: 'Por Compañía', icon: '🏢', module: 'Pólizas' },
  { path: '/policies/by-branch', title: 'Por Ramo', icon: '📂', module: 'Pólizas' },
  { path: '/policies/supplements', title: 'Suplementos', icon: '📝', module: 'Pólizas' },

  // Insurance - Renewals
  { path: '/renewals', title: 'Vencimientos', icon: '📅', module: 'Seguros' },
  { path: '/renewals/upcoming', title: 'Próximos 30 días', icon: '⏰', module: 'Vencimientos' },
  { path: '/renewals/pending', title: 'Renovaciones Pendientes', icon: '🔄', module: 'Vencimientos' },
  { path: '/renewals/calendar', title: 'Calendario', icon: '📆', module: 'Vencimientos' },
  { path: '/renewals/auto', title: 'Renovación Automática', icon: '⚡', module: 'Vencimientos' },

  // Insurance - Claims
  { path: '/claims', title: 'Siniestros', icon: '📈', module: 'Seguros' },
  { path: '/claims/open', title: 'Siniestros Abiertos', icon: '🔓', module: 'Siniestros' },
  { path: '/claims/new', title: 'Nuevo Siniestro', icon: '➕', module: 'Siniestros' },
  { path: '/claims/tracking', title: 'Seguimiento', icon: '👁️', module: 'Siniestros' },
  { path: '/claims/closed', title: 'Siniestros Cerrados', icon: '🔒', module: 'Siniestros' },
  { path: '/claims/experts', title: 'Peritajes', icon: '🔍', module: 'Siniestros' },
  { path: '/claims/payments', title: 'Indemnizaciones', icon: '💳', module: 'Siniestros' },

  // Insurance - Receipts
  { path: '/receipts', title: 'Recibos', icon: '🧾', module: 'Seguros' },
  { path: '/receipts/pending', title: 'Pendientes de Cobro', icon: '⏳', module: 'Recibos' },
  { path: '/receipts/paid', title: 'Cobrados', icon: '✅', module: 'Recibos' },
  { path: '/receipts/returned', title: 'Devueltos', icon: '↩️', module: 'Recibos' },
  { path: '/receipts/remittances', title: 'Remesas', icon: '📦', module: 'Recibos' },

  // Finance - Commissions
  { path: '/commissions', title: 'Comisiones', icon: '💰', module: 'Finanzas' },
  { path: '/commissions/pending', title: 'Pendientes de Cobro', icon: '⏳', module: 'Comisiones' },
  { path: '/commissions/collected', title: 'Cobradas', icon: '✅', module: 'Comisiones' },
  { path: '/commissions/reconciliation', title: 'Reconciliación', icon: '🔄', module: 'Comisiones' },
  { path: '/commissions/by-company', title: 'Por Compañía', icon: '🏢', module: 'Comisiones' },
  { path: '/commissions/by-agent', title: 'Por Mediador', icon: '👤', module: 'Comisiones' },
  { path: '/commissions/rappels', title: 'Rappels', icon: '🎁', module: 'Comisiones' },

  // Finance - Accounting
  { path: '/accounting', title: 'Contabilidad', icon: '📒', module: 'Finanzas' },
  { path: '/accounting/journal', title: 'Libro Diario', icon: '📖', module: 'Contabilidad' },
  { path: '/accounting/ledger', title: 'Libro Mayor', icon: '📚', module: 'Contabilidad' },
  { path: '/accounting/invoices', title: 'Facturas', icon: '🧾', module: 'Contabilidad' },
  { path: '/accounting/expenses', title: 'Gastos', icon: '💸', module: 'Contabilidad' },
  { path: '/accounting/taxes', title: 'Impuestos', icon: '🏛️', module: 'Contabilidad' },

  // Finance - Treasury
  { path: '/treasury', title: 'Tesorería', icon: '🏦', module: 'Finanzas' },
  { path: '/treasury/cash', title: 'Caja', icon: '💵', module: 'Tesorería' },
  { path: '/treasury/banks', title: 'Bancos', icon: '🏦', module: 'Tesorería' },
  { path: '/treasury/payments', title: 'Pagos', icon: '💳', module: 'Tesorería' },
  { path: '/treasury/forecasts', title: 'Previsiones', icon: '📊', module: 'Tesorería' },

  // Communications - Email
  { path: '/communications/email', title: 'Email', icon: '✉️', module: 'Comunicaciones' },
  { path: '/communications/email/inbox', title: 'Bandeja de Entrada', icon: '📥', module: 'Email' },
  { path: '/communications/email/sent', title: 'Enviados', icon: '📤', module: 'Email' },
  { path: '/communications/email/drafts', title: 'Borradores', icon: '📝', module: 'Email' },
  { path: '/communications/email/templates', title: 'Plantillas', icon: '📄', module: 'Email' },
  { path: '/communications/email/campaigns', title: 'Campañas', icon: '📣', module: 'Email' },

  // Communications - SMS
  { path: '/communications/sms', title: 'SMS', icon: '📱', module: 'Comunicaciones' },
  { path: '/communications/sms/send', title: 'Enviar SMS', icon: '📤', module: 'SMS' },
  { path: '/communications/sms/history', title: 'Historial', icon: '📋', module: 'SMS' },
  { path: '/communications/sms/campaigns', title: 'Campañas', icon: '📣', module: 'SMS' },
  { path: '/communications/sms/templates', title: 'Plantillas', icon: '📄', module: 'SMS' },

  // Communications - WhatsApp
  { path: '/communications/whatsapp', title: 'WhatsApp Business', icon: '💬', module: 'Comunicaciones' },
  { path: '/communications/whatsapp/chats', title: 'Conversaciones', icon: '💭', module: 'WhatsApp' },
  { path: '/communications/whatsapp/broadcast', title: 'Difusión', icon: '📢', module: 'WhatsApp' },
  { path: '/communications/whatsapp/templates', title: 'Plantillas', icon: '📄', module: 'WhatsApp' },
  { path: '/communications/whatsapp/automations', title: 'Automatizaciones', icon: '🤖', module: 'WhatsApp' },

  // Communications - Calls
  { path: '/communications/calls', title: 'Teléfono', icon: '📞', module: 'Comunicaciones' },
  { path: '/communications/calls/history', title: 'Historial de Llamadas', icon: '📋', module: 'Teléfono' },
  { path: '/communications/calls/recordings', title: 'Grabaciones', icon: '🎙️', module: 'Teléfono' },
  { path: '/communications/calls/schedule', title: 'Programar Llamada', icon: '📅', module: 'Teléfono' },

  // Documents
  { path: '/documents', title: 'Archivo Digital', icon: '📁', module: 'Documentos' },
  { path: '/documents/by-client', title: 'Por Cliente', icon: '👤', module: 'Documentos' },
  { path: '/documents/by-policy', title: 'Por Póliza', icon: '📋', module: 'Documentos' },
  { path: '/documents/by-claim', title: 'Por Siniestro', icon: '📈', module: 'Documentos' },
  { path: '/documents/upload', title: 'Subir Documento', icon: '⬆️', module: 'Documentos' },

  // Documents - Templates
  { path: '/documents/templates', title: 'Plantillas', icon: '📄', module: 'Documentos' },
  { path: '/documents/templates/letters', title: 'Cartas', icon: '✉️', module: 'Plantillas' },
  { path: '/documents/templates/contracts', title: 'Contratos', icon: '📜', module: 'Plantillas' },
  { path: '/documents/templates/forms', title: 'Formularios', icon: '📝', module: 'Plantillas' },
  { path: '/documents/templates/reports', title: 'Informes', icon: '📊', module: 'Plantillas' },

  // Documents - Signatures
  { path: '/documents/signatures', title: 'Firma Digital', icon: '✍️', module: 'Documentos' },
  { path: '/documents/signatures/pending', title: 'Pendientes de Firma', icon: '⏳', module: 'Firmas' },
  { path: '/documents/signatures/signed', title: 'Firmados', icon: '✅', module: 'Firmas' },
  { path: '/documents/signatures/request', title: 'Solicitar Firma', icon: '📤', module: 'Firmas' },

  // AI - Agents
  { path: '/ai/agents', title: 'Agentes IA', icon: '🤖', module: 'IA' },
  { path: '/ai/agents/sales', title: 'Asistente de Ventas', icon: '💼', module: 'Agentes IA' },
  { path: '/ai/agents/risk', title: 'Análisis de Riesgos', icon: '⚠️', module: 'Agentes IA' },
  { path: '/ai/agents/support', title: 'Atención al Cliente', icon: '🎧', module: 'Agentes IA' },
  { path: '/ai/agents/docs', title: 'Procesamiento de Docs', icon: '📄', module: 'Agentes IA' },
  { path: '/ai/agents/config', title: 'Configuración IA', icon: '⚙️', module: 'Agentes IA' },

  // AI - Automations
  { path: '/ai/automations', title: 'Automatizaciones', icon: '⚡', module: 'IA' },
  { path: '/ai/automations/workflows', title: 'Workflows', icon: '🔄', module: 'Automatizaciones' },
  { path: '/ai/automations/rules', title: 'Reglas de Negocio', icon: '📏', module: 'Automatizaciones' },
  { path: '/ai/automations/triggers', title: 'Triggers', icon: '🎯', module: 'Automatizaciones' },
  { path: '/ai/automations/schedules', title: 'Programaciones', icon: '📅', module: 'Automatizaciones' },
  { path: '/ai/automations/logs', title: 'Historial', icon: '📋', module: 'Automatizaciones' },

  // AI - Predictive
  { path: '/ai/predictive', title: 'Analytics Predictivo', icon: '🔮', module: 'IA' },
  { path: '/ai/predictive/churn', title: 'Predicción de Bajas', icon: '📉', module: 'Predictivo' },
  { path: '/ai/predictive/upsell', title: 'Oportunidades Venta', icon: '📈', module: 'Predictivo' },
  { path: '/ai/predictive/scoring', title: 'Scoring de Clientes', icon: '⭐', module: 'Predictivo' },
  { path: '/ai/predictive/claims', title: 'Predicción Siniestros', icon: '🎲', module: 'Predictivo' },

  // Analytics - Dashboards
  { path: '/analytics/dashboards', title: 'Dashboards', icon: '📊', module: 'Analytics' },
  { path: '/analytics/dashboards/production', title: 'Producción', icon: '🏭', module: 'Dashboards' },
  { path: '/analytics/dashboards/portfolio', title: 'Cartera', icon: '💼', module: 'Dashboards' },
  { path: '/analytics/dashboards/claims', title: 'Siniestralidad', icon: '📈', module: 'Dashboards' },
  { path: '/analytics/dashboards/sales', title: 'Ventas', icon: '💰', module: 'Dashboards' },
  { path: '/analytics/dashboards/custom', title: 'Personalizado', icon: '🎨', module: 'Dashboards' },

  // Analytics - Reports
  { path: '/analytics/reports', title: 'Informes', icon: '📑', module: 'Analytics' },
  { path: '/analytics/reports/standard', title: 'Estándar', icon: '📄', module: 'Informes' },
  { path: '/analytics/reports/custom', title: 'Personalizados', icon: '🎨', module: 'Informes' },
  { path: '/analytics/reports/scheduled', title: 'Programados', icon: '📅', module: 'Informes' },
  { path: '/analytics/reports/dgsfp', title: 'DGSFP / Regulatorio', icon: '🏛️', module: 'Informes' },

  // Analytics - Metrics
  { path: '/analytics/metrics', title: 'Métricas', icon: '📏', module: 'Analytics' },
  { path: '/analytics/metrics/kpis', title: 'KPIs', icon: '🎯', module: 'Métricas' },
  { path: '/analytics/metrics/objectives', title: 'Objetivos', icon: '🏆', module: 'Métricas' },
  { path: '/analytics/metrics/comparison', title: 'Comparativas', icon: '⚖️', module: 'Métricas' },
  { path: '/analytics/metrics/trends', title: 'Tendencias', icon: '📈', module: 'Métricas' },

  // Operations - Daily
  { path: '/operations/daily', title: 'Operativa Diaria', icon: '📆', module: 'Operaciones' },
  { path: '/operations/daily/tasks', title: 'Tareas del Día', icon: '✅', module: 'Operativa' },
  { path: '/operations/daily/agenda', title: 'Agenda', icon: '📅', module: 'Operativa' },
  { path: '/operations/daily/calls', title: 'Llamadas Programadas', icon: '📞', module: 'Operativa' },
  { path: '/operations/daily/visits', title: 'Visitas', icon: '🚗', module: 'Operativa' },
  { path: '/operations/daily/followups', title: 'Seguimientos', icon: '🔄', module: 'Operativa' },

  // Operations - Production
  { path: '/operations/production', title: 'Producción', icon: '📊', module: 'Operaciones' },
  { path: '/operations/production/new', title: 'Nueva Producción', icon: '➕', module: 'Producción' },
  { path: '/operations/production/pending', title: 'Pendiente Emisión', icon: '⏳', module: 'Producción' },
  { path: '/operations/production/issued', title: 'Emitida', icon: '✅', module: 'Producción' },
  { path: '/operations/production/cancelled', title: 'Anulaciones', icon: '❌', module: 'Producción' },

  // Operations - Portfolio
  { path: '/operations/portfolio', title: 'Cartera', icon: '💼', module: 'Operaciones' },
  { path: '/operations/portfolio/by-mediator', title: 'Por Mediador', icon: '👤', module: 'Cartera' },
  { path: '/operations/portfolio/by-company', title: 'Por Compañía', icon: '🏢', module: 'Cartera' },
  { path: '/operations/portfolio/evolution', title: 'Evolución', icon: '📊', module: 'Cartera' },

  // Operations - Quality
  { path: '/operations/quality', title: 'Calidad', icon: '⭐', module: 'Operaciones' },
  { path: '/operations/quality/surveys', title: 'Encuestas', icon: '📝', module: 'Calidad' },
  { path: '/operations/quality/complaints', title: 'Reclamaciones', icon: '⚠️', module: 'Calidad' },
  { path: '/operations/quality/nps', title: 'NPS', icon: '📊', module: 'Calidad' },
  { path: '/operations/quality/reviews', title: 'Reseñas', icon: '💬', module: 'Calidad' },

  // HR - Employees
  { path: '/hr/employees', title: 'Empleados', icon: '👥', module: 'RRHH' },
  { path: '/hr/employees/new', title: 'Alta Empleado', icon: '➕', module: 'Empleados' },
  { path: '/hr/employees/contracts', title: 'Contratos', icon: '📜', module: 'Empleados' },
  { path: '/hr/employees/organigram', title: 'Organigrama', icon: '🏛️', module: 'Empleados' },

  // HR - Attendance
  { path: '/hr/attendance', title: 'Control Horario', icon: '⏰', module: 'RRHH' },
  { path: '/hr/attendance/clock', title: 'Fichajes', icon: '🕐', module: 'Control Horario' },
  { path: '/hr/attendance/calendar', title: 'Calendario', icon: '📅', module: 'Control Horario' },
  { path: '/hr/attendance/absences', title: 'Ausencias', icon: '🚫', module: 'Control Horario' },
  { path: '/hr/attendance/overtime', title: 'Horas Extra', icon: '⏱️', module: 'Control Horario' },

  // HR - Vacations
  { path: '/hr/vacations', title: 'Vacaciones', icon: '🏖️', module: 'RRHH' },
  { path: '/hr/vacations/requests', title: 'Solicitudes', icon: '📝', module: 'Vacaciones' },
  { path: '/hr/vacations/calendar', title: 'Calendario', icon: '📅', module: 'Vacaciones' },
  { path: '/hr/vacations/balance', title: 'Saldos', icon: '📊', module: 'Vacaciones' },

  // HR - Payroll
  { path: '/hr/payroll', title: 'Nóminas', icon: '💵', module: 'RRHH' },
  { path: '/hr/payroll/current', title: 'Nómina Actual', icon: '📄', module: 'Nóminas' },
  { path: '/hr/payroll/history', title: 'Histórico', icon: '📚', module: 'Nóminas' },
  { path: '/hr/payroll/bonuses', title: 'Variables', icon: '💰', module: 'Nóminas' },
  { path: '/hr/payroll/irpf', title: 'IRPF', icon: '🏛️', module: 'Nóminas' },

  // HR - Recruitment
  { path: '/hr/recruitment', title: 'Selección', icon: '🎯', module: 'RRHH' },
  { path: '/hr/recruitment/jobs', title: 'Ofertas', icon: '📢', module: 'Selección' },
  { path: '/hr/recruitment/candidates', title: 'Candidatos', icon: '👤', module: 'Selección' },
  { path: '/hr/recruitment/interviews', title: 'Entrevistas', icon: '🤝', module: 'Selección' },

  // Academy - Courses
  { path: '/academy/courses', title: 'Cursos', icon: '🎓', module: 'Academia' },
  { path: '/academy/courses/my', title: 'Mis Cursos', icon: '📖', module: 'Cursos' },
  { path: '/academy/courses/progress', title: 'Mi Progreso', icon: '📈', module: 'Cursos' },
  { path: '/academy/courses/certificates', title: 'Certificados', icon: '🏆', module: 'Cursos' },

  // Academy - Training
  { path: '/academy/training', title: 'Formación', icon: '📝', module: 'Academia' },
  { path: '/academy/training/dgsfp', title: 'DGSFP Obligatoria', icon: '🏛️', module: 'Formación' },
  { path: '/academy/training/products', title: 'Productos', icon: '📦', module: 'Formación' },
  { path: '/academy/training/skills', title: 'Habilidades', icon: '💪', module: 'Formación' },
  { path: '/academy/training/compliance', title: 'Compliance', icon: '⚖️', module: 'Formación' },

  // Academy - Knowledge
  { path: '/academy/knowledge', title: 'Base de Conocimiento', icon: '📖', module: 'Academia' },
  { path: '/academy/knowledge/wiki', title: 'Wiki Interna', icon: '📄', module: 'Conocimiento' },
  { path: '/academy/knowledge/procedures', title: 'Procedimientos', icon: '📋', module: 'Conocimiento' },
  { path: '/academy/knowledge/faq', title: 'FAQ', icon: '❓', module: 'Conocimiento' },
  { path: '/academy/knowledge/videos', title: 'Videoteca', icon: '🎬', module: 'Conocimiento' },

  // Academy - Exams
  { path: '/academy/exams', title: 'Evaluaciones', icon: '📝', module: 'Academia' },
  { path: '/academy/exams/pending', title: 'Pendientes', icon: '⏳', module: 'Evaluaciones' },
  { path: '/academy/exams/completed', title: 'Completados', icon: '✅', module: 'Evaluaciones' },
  { path: '/academy/exams/results', title: 'Resultados', icon: '📊', module: 'Evaluaciones' },

  // Marketing - Campaigns
  { path: '/marketing/campaigns', title: 'Campañas', icon: '📣', module: 'Marketing' },
  { path: '/marketing/campaigns/active', title: 'Activas', icon: '🟢', module: 'Campañas' },
  { path: '/marketing/campaigns/new', title: 'Nueva Campaña', icon: '➕', module: 'Campañas' },
  { path: '/marketing/campaigns/scheduled', title: 'Programadas', icon: '📅', module: 'Campañas' },
  { path: '/marketing/campaigns/completed', title: 'Finalizadas', icon: '✅', module: 'Campañas' },
  { path: '/marketing/campaigns/results', title: 'Resultados', icon: '📊', module: 'Campañas' },

  // Marketing - Content
  { path: '/marketing/content', title: 'Contenidos', icon: '📝', module: 'Marketing' },
  { path: '/marketing/content/blog', title: 'Blog', icon: '📰', module: 'Contenidos' },
  { path: '/marketing/content/social', title: 'Redes Sociales', icon: '📱', module: 'Contenidos' },
  { path: '/marketing/content/newsletter', title: 'Newsletter', icon: '✉️', module: 'Contenidos' },
  { path: '/marketing/content/media', title: 'Banco de Medios', icon: '🖼️', module: 'Contenidos' },

  // Marketing - Landing
  { path: '/marketing/landing', title: 'Landing Pages', icon: '🌐', module: 'Marketing' },
  { path: '/marketing/landing/new', title: 'Nueva Landing', icon: '➕', module: 'Landing Pages' },
  { path: '/marketing/landing/ab', title: 'Test A/B', icon: '🔬', module: 'Landing Pages' },
  { path: '/marketing/landing/conversions', title: 'Conversiones', icon: '📈', module: 'Landing Pages' },

  // Marketing - SEO
  { path: '/marketing/seo', title: 'SEO / SEM', icon: '🔍', module: 'Marketing' },
  { path: '/marketing/seo/keywords', title: 'Palabras Clave', icon: '🔑', module: 'SEO' },
  { path: '/marketing/seo/rankings', title: 'Rankings', icon: '📊', module: 'SEO' },
  { path: '/marketing/seo/ads', title: 'Google Ads', icon: '💰', module: 'SEO' },
  { path: '/marketing/seo/analytics', title: 'Analytics', icon: '📈', module: 'SEO' },

  // Marketing - Referrals
  { path: '/marketing/referrals', title: 'Referidos', icon: '🤝', module: 'Marketing' },
  { path: '/marketing/referrals/program', title: 'Programa', icon: '🎁', module: 'Referidos' },
  { path: '/marketing/referrals/rewards', title: 'Recompensas', icon: '🏆', module: 'Referidos' },

  // Strategy - Analysis
  { path: '/strategy/analysis', title: 'Análisis Estratégico', icon: '🎯', module: 'Estrategia' },
  { path: '/strategy/analysis/pestel', title: 'PESTEL', icon: '🌍', module: 'Análisis' },
  { path: '/strategy/analysis/porter', title: 'Porter 5 Fuerzas', icon: '⚔️', module: 'Análisis' },
  { path: '/strategy/analysis/dafo', title: 'DAFO / SWOT', icon: '📊', module: 'Análisis' },
  { path: '/strategy/analysis/came', title: 'CAME', icon: '🔄', module: 'Análisis' },

  // Strategy - Competition
  { path: '/strategy/competition', title: 'Competencia', icon: '🏆', module: 'Estrategia' },
  { path: '/strategy/competition/local', title: 'Competencia Local', icon: '📍', module: 'Competencia' },
  { path: '/strategy/competition/regional', title: 'Competencia Regional', icon: '🗺️', module: 'Competencia' },
  { path: '/strategy/competition/online', title: 'Competencia Online', icon: '🌐', module: 'Competencia' },
  { path: '/strategy/competition/market-share', title: 'Cuota de Mercado', icon: '📈', module: 'Competencia' },

  // Strategy - Planning
  { path: '/strategy/planning', title: 'Planificación', icon: '📋', module: 'Estrategia' },
  { path: '/strategy/planning/objectives', title: 'Objetivos', icon: '🎯', module: 'Planificación' },
  { path: '/strategy/planning/tactics', title: 'Tácticas', icon: '♟️', module: 'Planificación' },
  { path: '/strategy/planning/kpis', title: 'KPIs Estratégicos', icon: '📊', module: 'Planificación' },
  { path: '/strategy/planning/timeline', title: 'Cronograma', icon: '📅', module: 'Planificación' },

  // Strategy - Execution
  { path: '/strategy/execution', title: 'Ejecución', icon: '🚀', module: 'Estrategia' },
  { path: '/strategy/execution/actions', title: 'Plan de Acción', icon: '✅', module: 'Ejecución' },
  { path: '/strategy/execution/tracking', title: 'Seguimiento', icon: '👁️', module: 'Ejecución' },
  { path: '/strategy/execution/results', title: 'Resultados', icon: '📈', module: 'Ejecución' },

  // Admin - Users
  { path: '/admin/users', title: 'Usuarios', icon: '👤', module: 'Admin' },
  { path: '/admin/users/new', title: 'Nuevo Usuario', icon: '➕', module: 'Usuarios' },
  { path: '/admin/users/roles', title: 'Roles y Permisos', icon: '🔐', module: 'Usuarios' },
  { path: '/admin/users/activity', title: 'Actividad', icon: '📋', module: 'Usuarios' },
  { path: '/admin/users/teams', title: 'Equipos', icon: '👥', module: 'Usuarios' },

  // Admin - Companies
  { path: '/admin/companies', title: 'Compañías', icon: '🏢', module: 'Admin' },
  { path: '/admin/companies/insurers', title: 'Aseguradoras', icon: '🏛️', module: 'Compañías' },
  { path: '/admin/companies/products', title: 'Productos', icon: '📦', module: 'Compañías' },
  { path: '/admin/companies/rates', title: 'Tarifas', icon: '💵', module: 'Compañías' },
  { path: '/admin/companies/contacts', title: 'Contactos', icon: '📇', module: 'Compañías' },

  // Admin - Settings
  { path: '/admin/settings', title: 'Configuración', icon: '⚙️', module: 'Admin' },
  { path: '/admin/settings/general', title: 'General', icon: '🔧', module: 'Configuración' },
  { path: '/admin/settings/branding', title: 'Personalización', icon: '🎨', module: 'Configuración' },
  { path: '/admin/settings/integrations', title: 'Integraciones', icon: '🔗', module: 'Configuración' },
  { path: '/admin/settings/notifications', title: 'Notificaciones', icon: '🔔', module: 'Configuración' },
  { path: '/admin/settings/security', title: 'Seguridad', icon: '🔒', module: 'Configuración' },

  // Admin - System
  { path: '/admin/system', title: 'Sistema', icon: '🖥️', module: 'Admin' },
  { path: '/admin/system/databases', title: 'Bases de Datos', icon: '💾', module: 'Sistema' },
  { path: '/admin/system/logs', title: 'Logs', icon: '📋', module: 'Sistema' },
  { path: '/admin/system/backups', title: 'Backups', icon: '💿', module: 'Sistema' },
  { path: '/admin/system/health', title: 'Estado del Sistema', icon: '❤️', module: 'Sistema' },
  { path: '/admin/system/updates', title: 'Actualizaciones', icon: '🔄', module: 'Sistema' },

  // User pages
  { path: '/profile', title: 'Mi Perfil', icon: '👤', module: 'Usuario' },
  { path: '/preferences', title: 'Preferencias', icon: '⚙️', module: 'Usuario' },
  { path: '/notifications', title: 'Notificaciones', icon: '🔔', module: 'Usuario' },
  { path: '/help', title: 'Ayuda', icon: '❓', module: 'Usuario' },
];

const baseDir = path.join(__dirname, '..', 'src', 'app', '(modules)');

function createPageContent(page) {
  const pathParts = page.path.split('/').filter(Boolean);
  const breadcrumb = pathParts.length > 1
    ? pathParts.slice(0, -1).map((part, index) => ({
        label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        path: '/' + pathParts.slice(0, index + 1).join('/')
      }))
    : [];

  const breadcrumbStr = breadcrumb.length > 0
    ? `breadcrumb={[
        ${breadcrumb.map(b => `{ label: '${b.label}', path: '${b.path}' }`).join(',\n        ')},
        { label: '${page.title}' }
      ]}`
    : '';

  return `'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ${page.title.replace(/[^a-zA-Z0-9]/g, '')}Page() {
  return (
    <PageTemplate
      title="${page.title}"
      subtitle="Gestión de ${page.title.toLowerCase()}"
      icon="${page.icon}"
      module="${page.module}"
      ${breadcrumbStr}
    />
  );
}
`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

let created = 0;
let skipped = 0;

pages.forEach(page => {
  const pagePath = page.path.replace(/^\//, '');
  const pageDir = path.join(baseDir, pagePath);
  const pageFile = path.join(pageDir, 'page.tsx');

  ensureDir(pageDir);

  if (!fs.existsSync(pageFile)) {
    fs.writeFileSync(pageFile, createPageContent(page));
    created++;
    console.log(`Created: ${pageFile}`);
  } else {
    skipped++;
  }
});

console.log(`\nDone! Created: ${created}, Skipped: ${skipped}`);
