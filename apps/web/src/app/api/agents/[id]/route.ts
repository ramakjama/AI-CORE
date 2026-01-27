import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // In production, fetch from backend
  // const { data } = await graphqlRequest(queries.GET_AGENT, { id }, { token });

  // Mock response
  const agent = {
    id,
    name: 'Agente Demo',
    description: 'Descripcion del agente',
    type: 'assistant',
    status: 'active',
    runs: 100,
    lastRun: new Date().toISOString(),
    successRate: 95.0,
    avgResponseTime: '1.5s',
    capabilities: ['Capability 1', 'Capability 2'],
  };

  return NextResponse.json({
    success: true,
    data: agent,
  });
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();

    // In production, update via backend
    // const { data } = await graphqlRequest(mutations.UPDATE_AGENT, { id, input: body }, { token });

    return NextResponse.json({
      success: true,
      data: { id, ...body, updatedAt: new Date().toISOString() },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const { id } = await params;

  // In production, delete via backend
  // const { data } = await graphqlRequest(mutations.DELETE_AGENT, { id }, { token });

  return NextResponse.json({
    success: true,
    message: `Agent ${id} deleted`,
  });
}
