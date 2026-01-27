import { NextResponse } from 'next/server';

// Mock data - in production, this would come from the backend API
const agents = [
  {
    id: 'agent-1',
    name: 'Asistente de Renovaciones',
    description: 'Gestiona automaticamente los recordatorios de renovacion de polizas.',
    type: 'automation',
    status: 'active',
    runs: 1247,
    lastRun: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    successRate: 98.5,
    avgResponseTime: '1.2s',
    capabilities: ['Analisis de polizas', 'Envio de emails', 'Generacion de propuestas', 'Seguimiento automatico'],
  },
  {
    id: 'agent-2',
    name: 'Clasificador de Documentos',
    description: 'Analiza y clasifica documentos entrantes usando vision por computador e IA.',
    type: 'analysis',
    status: 'active',
    runs: 3892,
    lastRun: new Date(Date.now() - 30 * 1000).toISOString(),
    successRate: 96.8,
    avgResponseTime: '2.5s',
    capabilities: ['OCR avanzado', 'Clasificacion automatica', 'Extraccion de datos', 'Validacion de documentos'],
  },
  {
    id: 'agent-3',
    name: 'Asistente de Atencion',
    description: 'Responde consultas frecuentes de clientes via chat, email y WhatsApp.',
    type: 'assistant',
    status: 'active',
    runs: 892,
    lastRun: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    successRate: 94.2,
    avgResponseTime: '0.8s',
    capabilities: ['Chat multicanal', 'FAQ automatico', 'Derivacion inteligente', 'Analisis de sentimiento'],
  },
  {
    id: 'agent-4',
    name: 'Analizador de Siniestros',
    description: 'Analiza reclamaciones entrantes, detecta patrones sospechosos de fraude.',
    type: 'analysis',
    status: 'idle',
    runs: 456,
    lastRun: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    successRate: 99.1,
    avgResponseTime: '3.8s',
    capabilities: ['Deteccion de fraude', 'Analisis de riesgo', 'Priorizacion automatica', 'Informes detallados'],
  },
];

export async function GET() {
  // In production, fetch from backend GraphQL API
  // const { data } = await graphqlRequest(queries.GET_AGENTS, {}, { token });

  return NextResponse.json({
    success: true,
    data: agents,
    total: agents.length,
    activeCount: agents.filter(a => a.status === 'active').length,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, type, capabilities } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const newAgent = {
      id: `agent-${Date.now()}`,
      name,
      description: description || '',
      type,
      status: 'idle',
      runs: 0,
      lastRun: null,
      successRate: 0,
      avgResponseTime: '0s',
      capabilities: capabilities || [],
      createdAt: new Date().toISOString(),
    };

    // In production, save to backend
    // const { data } = await graphqlRequest(mutations.CREATE_AGENT, { input: newAgent }, { token });

    return NextResponse.json({
      success: true,
      data: newAgent,
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create agent' },
      { status: 500 }
    );
  }
}
