/**
 * Web Vitals Analytics API Route
 * Collects and stores Web Vitals metrics
 */

import { NextRequest, NextResponse } from 'next/server';

interface WebVitalMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Web Vital:', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    }

    // In production, you would:
    // 1. Store in database
    // 2. Send to analytics service (Google Analytics, Vercel Analytics, etc.)
    // 3. Aggregate for monitoring

    // Example: Send to analytics service
    if (process.env.NODE_ENV === 'production') {
      // Google Analytics example
      if (process.env.NEXT_PUBLIC_GA_ID) {
        fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${process.env.NEXT_PUBLIC_GA_ID}&api_secret=${process.env.GA_API_SECRET}`, {
          method: 'POST',
          body: JSON.stringify({
            client_id: metric.id,
            events: [{
              name: 'web_vitals',
              params: {
                event_category: 'Web Vitals',
                event_label: metric.name,
                value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                metric_value: metric.value,
                metric_rating: metric.rating,
              },
            }],
          }),
        }).catch(console.error);
      }

      // Example: Store in database
      // await prisma.webVital.create({
      //   data: {
      //     name: metric.name,
      //     value: metric.value,
      //     rating: metric.rating,
      //     timestamp: new Date(),
      //   },
      // });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record web vital:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record metric' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
