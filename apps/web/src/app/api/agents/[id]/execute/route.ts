import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const input = await request.json().catch(() => ({}));

    // In production, execute via backend
    // const { data } = await graphqlRequest(mutations.EXECUTE_AGENT, { id, input }, { token });

    // Use input for logging (prevents unused variable error)
    console.log(`Executing agent ${id} with input:`, input);

    // Simulate execution
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 100));
    const executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        agentId: id,
        executionId: `exec-${Date.now()}`,
        status: 'completed',
        result: {
          message: 'Ejecucion completada exitosamente',
          processedItems: Math.floor(Math.random() * 100) + 1,
        },
        executionTime: `${executionTime}ms`,
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to execute agent' },
      { status: 500 }
    );
  }
}
