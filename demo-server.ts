// AI-CORE Demo Server - Prueba de módulos
import http from 'http';

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
  'AI-MDM', 'AI-HR', 'AI-Finance', 'AI-Projects', 'AI-Leads', 'AI-Integrations'
];

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
  } else if (req.url === '/agents') {
    res.writeHead(200);
    res.end(JSON.stringify({ agents, total: Object.keys(agents).length }));
  } else if (req.url === '/modules') {
    res.writeHead(200);
    res.end(JSON.stringify({ modules, total: modules.length }));
  } else if (req.url === '/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      platform: 'AI-CORE / SOBI',
      version: '1.0.0',
      modules: modules.length,
      agents: Object.keys(agents).length,
      databases: 38,
      status: 'running',
      endpoints: {
        health: '/health',
        agents: '/agents',
        modules: '/modules',
        chat: '/chat (POST)',
      }
    }));
  } else if (req.url === '/chat' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { message, agent } = JSON.parse(body);
        const selectedAgent = agents[agent as keyof typeof agents] || agents.customerService;
        res.writeHead(200);
        res.end(JSON.stringify({
          agent: selectedAgent.name,
          response: `¡Hola! Soy ${selectedAgent.name}. He recibido tu mensaje: "${message}". ¿En qué puedo ayudarte?`,
          timestamp: new Date().toISOString()
        }));
      } catch {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: '🚀 AI-CORE Platform Running',
      description: 'Sistema Operativo de Business Intelligence - SOBI',
      endpoints: ['/health', '/agents', '/modules', '/status', '/chat'],
    }));
  }
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     AI-CORE PLATFORM                          ║
║              Sistema Operativo de Business Intelligence       ║
╠══════════════════════════════════════════════════════════════╣
║  Server running at http://localhost:${PORT}                      ║
║                                                              ║
║  Endpoints:                                                  ║
║    GET  /         - Welcome message                          ║
║    GET  /health   - Health check                             ║
║    GET  /agents   - List all AI agents (${Object.keys(agents).length} agents)            ║
║    GET  /modules  - List all modules (${modules.length} modules)             ║
║    GET  /status   - Platform status                          ║
║    POST /chat     - Chat with an agent                       ║
║                                                              ║
║  Modules: ${modules.length} | Agents: ${Object.keys(agents).length} | Databases: 38              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});
