// API Route: POST /api/auth/register
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, AuthResponse, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, phone } = body;

    // Validate input
    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email, password and name are required',
        },
      }, { status: 400 });
    }

    // TODO: Replace with real user registration
    // This is a mock implementation for demonstration
    const mockUser: User = {
      id: 'user-' + Date.now(),
      email,
      name,
      role: 'agent',
      status: 'active',
      phone: phone || undefined,
      permissions: ['read', 'write'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockAuthResponse: AuthResponse = {
      user: mockUser,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600,
    };

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: mockAuthResponse,
      message: 'Registration successful',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during registration',
        details: error.message,
      },
    }, { status: 500 });
  }
}
