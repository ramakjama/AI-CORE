import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { traceManager } from '@/lib/traceability';

export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;

    // Intentar obtener del manager en memoria
    const liveState = traceManager.getState(executionId);
    if (liveState) {
      return NextResponse.json(liveState);
    }

    // Si no está en memoria, buscar en BD
    const execution = await prisma.scraperExecution.findUnique({
      where: { id: executionId },
      include: {
        logs: {
          orderBy: { timestamp: 'asc' },
          take: 1000,
        },
      },
    });

    if (!execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Reconstruir estado desde BD
    const state = {
      scraperId: execution.scraperId,
      executionId: execution.id,
      startedAt: execution.startedAt,
      currentStep: execution.currentStep
        ? JSON.parse(execution.currentStep as string)
        : null,
      breadcrumb: execution.breadcrumb || [],
      history: execution.logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        action: log.message,
        location: (log.metadata as any)?.location || {},
        data: (log.metadata as any)?.data,
        status: (log.metadata as any)?.status || 'completed',
      })),
      progress: {
        current: execution.itemsProcessed || 0,
        total: execution.totalItems || 0,
        percentage: execution.progress || 0,
        eta: execution.finishedAt || new Date(),
        speed: 0,
        elapsed: Date.now() - execution.startedAt.getTime(),
        remaining: 0,
      },
      metadata: execution.metadata || {},
    };

    return NextResponse.json(state);
  } catch (error) {
    console.error('Error fetching trace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
