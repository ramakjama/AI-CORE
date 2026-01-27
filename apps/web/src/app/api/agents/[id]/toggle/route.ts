import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;

    // In production, toggle via backend
    // const { data } = await graphqlRequest(mutations.TOGGLE_AGENT_STATUS, { id }, { token });

    // Mock toggle - in real implementation, this would fetch current status and toggle
    const newStatus = Math.random() > 0.5 ? 'active' : 'idle';

    return NextResponse.json({
      success: true,
      data: {
        id,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to toggle agent status' },
      { status: 500 }
    );
  }
}
