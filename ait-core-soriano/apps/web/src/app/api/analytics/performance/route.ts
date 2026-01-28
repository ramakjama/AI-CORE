/**
 * Custom Performance Metrics API Route
 * Collects custom performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';

interface PerformanceMetric {
  name: string;
  data: any;
  timestamp: number;
}

export async function POST(request: NextRequest) {
  try {
    const metric: PerformanceMetric = await request.json();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Performance Metric:', metric);
    }

    // In production, store or send to analytics
    if (process.env.NODE_ENV === 'production') {
      // Example: Store in database
      // await prisma.performanceMetric.create({
      //   data: {
      //     name: metric.name,
      //     data: JSON.stringify(metric.data),
      //     timestamp: new Date(metric.timestamp),
      //   },
      // });

      // Example: Send to monitoring service
      // await sendToMonitoring(metric);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record performance metric:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
