import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session_token')?.value;

  if (!sessionToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  // In production, validate the session token against the backend
  // For now, return a mock session
  return NextResponse.json({
    authenticated: true,
    session: {
      token: sessionToken,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken, user } = body;

    if (!accessToken || !user) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Session created',
    });

    // Set secure session cookie
    response.cookies.set('session_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    if (refreshToken) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return response;
  } catch {
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Session deleted',
  });

  response.cookies.delete('session_token');
  response.cookies.delete('refresh_token');

  return response;
}
