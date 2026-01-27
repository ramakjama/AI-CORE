import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Azure AD Configuration
const AZURE_CONFIG = {
  tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
  clientId: process.env.AZURE_AD_CLIENT_ID || '',
  clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
  redirectUri: process.env.AZURE_AD_REDIRECT_URI || 'http://localhost:3000/auth/callback',
  allowedDomain: 'sorianomediadores.es',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, state } = body;

    // Verify state (CSRF protection)
    const cookieStore = await cookies();
    const savedState = cookieStore.get('oauth_state')?.value;

    if (!savedState || savedState !== state) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_STATE', message: 'Estado de autenticación inválido' } },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const tokenUrl = `https://login.microsoftonline.com/${AZURE_CONFIG.tenantId}/oauth2/v2.0/token`;

    const tokenParams = new URLSearchParams({
      client_id: AZURE_CONFIG.clientId,
      client_secret: AZURE_CONFIG.clientSecret,
      code,
      redirect_uri: AZURE_CONFIG.redirectUri,
      grant_type: 'authorization_code',
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.json();
      return NextResponse.json(
        { success: false, error: { code: 'TOKEN_ERROR', message: error.error_description || 'Error al obtener tokens' } },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Decode ID token to get user info
    const idTokenParts = tokens.id_token.split('.');
    const payload = JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString());

    // Validate domain
    const email = payload.email || payload.preferred_username;
    const domain = email?.split('@')[1]?.toLowerCase();

    if (domain !== AZURE_CONFIG.allowedDomain) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DOMAIN_NOT_ALLOWED',
            message: `Solo se permiten cuentas del dominio @${AZURE_CONFIG.allowedDomain}`
          }
        },
        { status: 403 }
      );
    }

    // Get user profile from Microsoft Graph
    const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    let user: {
      id: string;
      email: string;
      displayName: string;
      givenName?: string;
      surname?: string;
      department?: string;
      jobTitle?: string;
    } = {
      id: payload.oid,
      email,
      displayName: payload.name,
      givenName: payload.given_name,
      surname: payload.family_name,
    };

    if (userResponse.ok) {
      const graphUser = await userResponse.json();
      user = {
        ...user,
        displayName: graphUser.displayName || user.displayName,
        givenName: graphUser.givenName || user.givenName,
        surname: graphUser.surname || user.surname,
        department: graphUser.department,
        jobTitle: graphUser.jobTitle,
      };
    }

    // Clear state cookie
    const response = NextResponse.json({
      success: true,
      user,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      },
    });

    response.cookies.delete('oauth_state');

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'AUTH_ERROR', message: 'Error de autenticación' } },
      { status: 500 }
    );
  }
}
