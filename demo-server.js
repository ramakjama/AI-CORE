// AI-CORE Demo Server - Prueba de módulos
const http = require('http');

// Simular los servicios de AI-Core
const agents = {
  sales: { name: 'Agente Comercial SORI', status: 'active' },
  claims: { name: 'Agente de Siniestros SORI', status: 'active' },
  customerService: { name: 'Agente de Atención al Cliente SORI', status: 'active' },
  retention: { name: 'Agente de Retención SORI', status: 'active' },
  hr: { name: 'Agente de RRHH SORI', status: 'active' },
  finance: { name: 'Agente Financiero SORI', status: 'active' },
  itSupport: { name: 'Agente de Soporte IT SORI', status: 'active' },
  compliance: { name: 'Agente de Cumplimiento SORI', status: 'active' },
  legal: { name: 'Agente Legal SORI', status: 'active' },
  underwriting: { name: 'Agente de Suscripción SORI', status: 'active' },
  marketing: { name: 'Agente de Marketing SORI', status: 'active' },
  training: { name: 'Agente de Formación SORI', status: 'active' },
  quality: { name: 'Agente de Calidad SORI', status: 'active' },
  collections: { name: 'Agente de Cobros SORI', status: 'active' },
  procurement: { name: 'Agente de Compras SORI', status: 'active' },
  analytics: { name: 'Agente de Analytics SORI', status: 'active' },
  supervisor: { name: 'Agente Supervisor SORI', status: 'active' },
};

const modules = [
  'AI-Analytics', 'AI-LLM', 'AI-Agents', 'AI-Workflows', 'AI-Insurance',
  'AI-Portal', 'AI-Documents', 'AI-Communications', 'AI-Gateway', 'AI-IAM',
  'AI-MDM', 'AI-HR', 'AI-Finance', 'AI-Projects', 'AI-Leads', 'AI-Integrations',
  'AI-Voice'
];

const llmProviders = {
  anthropic: {
    name: 'Anthropic Claude',
    models: ['claude-opus-4-5-20251101', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022'],
    status: 'configured'
  },
  openai: {
    name: 'OpenAI GPT',
    models: ['gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
    status: 'configured'
  },
  groq: {
    name: 'Groq (Ultra-fast)',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
    status: 'configured'
  },
  google: {
    name: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    status: 'configured'
  }
};

const databases = [
  'ai_core_main', 'ai_core_global', 'ai_core_system', 'ai_core_audit', 'ai_core_logs',
  'ss_insurance', 'ss_policies', 'ss_claims', 'ss_commissions', 'ss_carriers',
  'sm_hr', 'sm_hr_payroll', 'sm_hr_recruitment', 'sm_hr_training', 'sm_hr_performance',
  'sm_analytics', 'sm_analytics_reports', 'sm_analytics_dashboards', 'sm_analytics_metrics',
  'sm_ai_agents', 'sm_ai_models', 'sm_ai_training', 'sm_ai_prompts',
  'sm_communications', 'sm_comms_email', 'sm_comms_sms', 'sm_comms_whatsapp', 'sm_comms_voice',
  'sm_finance', 'sm_finance_accounting', 'sm_finance_invoicing', 'sm_finance_treasury',
  'sm_crm', 'sm_leads', 'sm_customers', 'sm_documents', 'sm_storage', 'sm_workflows', 'sm_tasks'
];

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
  } else if (req.url === '/agents') {
    res.writeHead(200);
    res.end(JSON.stringify({ agents, total: Object.keys(agents).length }));
  } else if (req.url === '/modules') {
    res.writeHead(200);
    res.end(JSON.stringify({ modules, total: modules.length }));
  } else if (req.url === '/databases') {
    res.writeHead(200);
    res.end(JSON.stringify({ databases, total: databases.length }));
  } else if (req.url === '/llm-providers' || req.url === '/providers') {
    res.writeHead(200);
    res.end(JSON.stringify({ providers: llmProviders, total: Object.keys(llmProviders).length }));
  } else if (req.url === '/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      platform: 'AI-CORE / SOBI',
      version: '1.0.0',
      modules: modules.length,
      agents: Object.keys(agents).length,
      databases: databases.length,
      status: 'running',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      llmProviders: Object.keys(llmProviders).length,
      endpoints: {
        health: '/health',
        agents: '/agents',
        modules: '/modules',
        databases: '/databases',
        providers: '/providers',
        chat: '/chat (POST)',
      }
    }));
  } else if (req.url === '/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, agent } = JSON.parse(body);
        const selectedAgent = agents[agent] || agents.customerService;
        res.writeHead(200);
        res.end(JSON.stringify({
          agent: selectedAgent.name,
          response: `Hola! Soy ${selectedAgent.name}. He recibido tu mensaje: "${message}". En que puedo ayudarte?`,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: 'AI-CORE Platform Running',
      description: 'Sistema Operativo de Business Intelligence - SOBI',
      company: 'SORIANO MEDIADORES DE SEGUROS S.L.',
      endpoints: ['/health', '/agents', '/modules', '/databases', '/providers', '/status', '/chat'],
    }));
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`
======================================================================
                        AI-CORE PLATFORM v1.0.0
              Sistema Operativo de Business Intelligence (SOBI)
              SORIANO MEDIADORES DE SEGUROS S.L.
======================================================================

  Server running at http://localhost:${PORT}

  Endpoints:
    GET  /           - Welcome message
    GET  /health     - Health check
    GET  /agents     - List all AI agents (${Object.keys(agents).length} agents)
    GET  /modules    - List all modules (${modules.length} modules)
    GET  /databases  - List all databases (${databases.length} databases)
    GET  /status     - Platform status
    POST /chat       - Chat with an agent

  Platform Stats:
    - Modules:   ${modules.length}
    - Agents:    ${Object.keys(agents).length}
    - Databases: ${databases.length}

======================================================================
  `);
});
