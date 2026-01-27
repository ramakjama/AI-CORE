import { NextResponse } from 'next/server';

// Azure AD Configuration (from environment)
const AZURE_CONFIG = {
  tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
  clientId: process.env.AZURE_AD_CLIENT_ID || '',
  redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  scopes: ['openid', 'profile', 'email', 'User.Read'],
  allowedDomain: 'sorianomediadores.es',
};

// Generate random string for state/nonce
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const redirectUri = body.redirectUri || AZURE_CONFIG.redirectUri;

    // Generate state and nonce for CSRF protection
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: AZURE_CONFIG.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: AZURE_CONFIG.scopes.join(' '),
      state,
      nonce,
      prompt: 'select_account',
      domain_hint: AZURE_CONFIG.allowedDomain,
    });

    const authority = `https://login.microsoftonline.com/${AZURE_CONFIG.tenantId}`;
    const url = `${authority}/oauth2/v2.0/authorize?${params}`;

    // Store state in response header (or use a session store in production)
    const response = NextResponse.json({
      url,
      state,
    });

    // Set state cookie for verification
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: { message: 'Error al iniciar autenticación' } },
      { status: 500 }
    );
  }
}
