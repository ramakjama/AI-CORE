// API Route: POST /api/auth/login
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponse, AuthResponse, User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Email and password are required',
        },
      }, { status: 400 });
    }

    // TODO: Replace with real authentication
    // This is a mock implementation for demonstration
    const mockUser: User = {
      id: 'user-1',
      email,
      name: 'Usuario Demo',
      role: 'admin',
      status: 'active',
      permissions: ['read', 'write', 'delete'],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLogin: new Date(),
    };

    const mockAuthResponse: AuthResponse = {
      user: mockUser,
      accessToken: 'mock-access-token-' + Date.now(),
      refreshToken: 'mock-refresh-token-' + Date.now(),
      expiresIn: 3600, // 1 hour
    };

    return NextResponse.json<ApiResponse<AuthResponse>>({
      success: true,
      data: mockAuthResponse,
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during login',
        details: error.message,
      },
    }, { status: 500 });
  }
}
