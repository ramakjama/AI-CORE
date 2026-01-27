import { NextResponse } from 'next/server';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    app: process.env.NEXT_PUBLIC_APP_NAME || 'AIT-CORE',
    environment: process.env.NODE_ENV,
    services: {
      web: 'operational',
      api: 'checking',
    },
  };

  // Check backend API connectivity
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/graphql';
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '{ __typename }' }),
      signal: AbortSignal.timeout(5000),
    });

    health.services.api = response.ok ? 'operational' : 'degraded';
  } catch {
    health.services.api = 'unavailable';
  }

  const allOperational = Object.values(health.services).every(s => s === 'operational');
  const statusCode = allOperational ? 200 : 503;

  return NextResponse.json(health, { status: statusCode });
}
