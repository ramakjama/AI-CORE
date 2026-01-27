/**
 * Enterprise Authentication Service
 * Microsoft Azure AD SSO + WebAuthn Biometrics + Domain Restriction
 * For SORIANO MEDIADORES DE SEGUROS S.L.
 */

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

import {
  AzureADConfig,
  AzureADUserProfile,
  AzureADTokenResponse,
  AzureADIdTokenClaims,
  AzureADLoginResult,
  OAuthState,
  AllowedUser,
  AllowedDomain,
  CreateAllowedUserDTO,
  UpdateAllowedUserDTO,
  DEFAULT_AZURE_AD_CONFIG,
} from '../types/azure-ad.types';

import {
  WebAuthnCredential,
  WebAuthnChallenge,
  RegistrationOptions,
  AuthenticationOptions,
  RegistrationResponse,
  AuthenticationResponse,
  VerificationResult,
  BiometricType,
  AuthenticatorType,
  DEFAULT_WEBAUTHN_CONFIG,
} from '../types/webauthn.types';

// ============================================================================
// IN-MEMORY STORAGE (Replace with database in production)
// ============================================================================

const allowedUsers: Map<string, AllowedUser> = new Map();
const allowedDomains: Map<string, AllowedDomain> = new Map();
const oauthStates: Map<string, OAuthState> = new Map();
const webauthnCredentials: Map<string, WebAuthnCredential> = new Map();
const webauthnChallenges: Map<string, WebAuthnChallenge> = new Map();

// Initialize default allowed domain
allowedDomains.set('sorianomediadores.es', {
  id: uuidv4(),
  domain: 'sorianomediadores.es',
  organizationName: 'SORIANO MEDIADORES DE SEGUROS S.L.',
  isActive: true,
  autoProvision: true,
  defaultRoles: ['user'],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// ============================================================================
// ENTERPRISE AUTH SERVICE
// ============================================================================

export class EnterpriseAuthService {
  private azureConfig: AzureADConfig;

  constructor(config?: Partial<AzureADConfig>) {
    this.azureConfig = {
      tenantId: process.env['AZURE_AD_TENANT_ID'] || '',
      clientId: process.env['AZURE_AD_CLIENT_ID'] || '',
      clientSecret: process.env['AZURE_AD_CLIENT_SECRET'] || '',
      redirectUri: process.env['AZURE_AD_REDIRECT_URI'] || 'http://localhost:3000/auth/callback',
      ...DEFAULT_AZURE_AD_CONFIG,
      ...config,
    } as AzureADConfig;
  }

  // ==========================================================================
  // DOMAIN VALIDATION
  // ==========================================================================

  /**
   * Check if email domain is allowed
   */
  isDomainAllowed(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return false;

    // Check specific domain whitelist
    const allowedDomain = allowedDomains.get(domain);
    if (allowedDomain?.isActive) return true;

    // Check config allowed domains
    return this.azureConfig.allowedDomains.includes(domain);
  }

  /**
   * Get domain from email
   */
  private extractDomain(email: string): string {
    return email.split('@')[1]?.toLowerCase() || '';
  }

  /**
   * Validate email format and domain
   */
  validateEmail(email: string): { valid: boolean; error?: string } {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Formato de email inválido' };
    }

    if (!this.isDomainAllowed(email)) {
      return {
        valid: false,
        error: `Solo se permiten cuentas del dominio @sorianomediadores.es`
      };
    }

    return { valid: true };
  }

  // ==========================================================================
  // AZURE AD SSO
  // ==========================================================================

  /**
   * Generate Azure AD authorization URL
   */
  getAuthorizationUrl(options?: {
    loginHint?: string;
    prompt?: 'login' | 'consent' | 'select_account';
  }): { url: string; state: string } {
    const state = crypto.randomBytes(32).toString('base64url');
    const nonce = crypto.randomBytes(32).toString('base64url');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    // Store state for verification
    const oauthState: OAuthState = {
      id: uuidv4(),
      state,
      nonce,
      codeVerifier,
      redirectUri: this.azureConfig.redirectUri,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      createdAt: new Date(),
    };
    oauthStates.set(state, oauthState);

    const params = new URLSearchParams({
      client_id: this.azureConfig.clientId,
      response_type: 'code',
      redirect_uri: this.azureConfig.redirectUri,
      response_mode: 'query',
      scope: this.azureConfig.scopes.join(' '),
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    if (options?.loginHint) {
      params.set('login_hint', options.loginHint);
    }
    if (options?.prompt) {
      params.set('prompt', options.prompt);
    }

    // Force domain hint for Soriano Mediadores
    params.set('domain_hint', 'sorianomediadores.es');

    const authority = this.azureConfig.authority || 'https://login.microsoftonline.com';
    const url = `${authority}/${this.azureConfig.tenantId}/oauth2/v2.0/authorize?${params}`;

    return { url, state };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    state: string
  ): Promise<AzureADLoginResult> {
    // Verify state
    const oauthState = oauthStates.get(state);
    if (!oauthState) {
      return {
        success: false,
        error: { code: 'INVALID_STATE', message: 'Estado de autenticación inválido' },
      };
    }

    if (new Date() > oauthState.expiresAt) {
      oauthStates.delete(state);
      return {
        success: false,
        error: { code: 'STATE_EXPIRED', message: 'La sesión de autenticación ha expirado' },
      };
    }

    try {
      const authority = this.azureConfig.authority || 'https://login.microsoftonline.com';
      const tokenUrl = `${authority}/${this.azureConfig.tenantId}/oauth2/v2.0/token`;

      const params = new URLSearchParams({
        client_id: this.azureConfig.clientId,
        client_secret: this.azureConfig.clientSecret,
        code,
        redirect_uri: oauthState.redirectUri,
        grant_type: 'authorization_code',
        code_verifier: oauthState.codeVerifier || '',
      });

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string; error_description?: string };
        return {
          success: false,
          error: {
            code: errorData.error || 'TOKEN_ERROR',
            message: errorData.error_description || 'Error al obtener tokens',
          },
        };
      }

      const tokens = await response.json() as AzureADTokenResponse;

      // Decode ID token
      const claims = this.decodeIdToken(tokens.idToken);

      // Validate domain
      const email = claims.email || claims.preferred_username;
      if (!this.isDomainAllowed(email)) {
        return {
          success: false,
          error: {
            code: 'DOMAIN_NOT_ALLOWED',
            message: 'Solo se permiten cuentas del dominio @sorianomediadores.es',
          },
        };
      }

      // Get user profile from Microsoft Graph
      const user = await this.getUserProfile(tokens.accessToken);

      // Check if user is in allowed list or auto-provision
      let allowedUser = this.getAllowedUserByEmail(email);
      if (!allowedUser) {
        const domain = allowedDomains.get(this.extractDomain(email));
        if (domain?.autoProvision) {
          allowedUser = await this.createAllowedUser({
            email,
            firstName: user.givenName,
            lastName: user.surname,
            department: user.department,
            jobTitle: user.jobTitle,
            roles: domain.defaultRoles,
          });
        } else {
          return {
            success: false,
            error: {
              code: 'USER_NOT_ALLOWED',
              message: 'Usuario no autorizado. Contacte con el administrador.',
            },
          };
        }
      }

      // Update last login
      allowedUser.lastLoginAt = new Date();
      allowedUser.loginCount += 1;
      allowedUser.azureObjectId = claims.oid;
      allowedUsers.set(allowedUser.id, allowedUser);

      // Clean up state
      oauthStates.delete(state);

      return {
        success: true,
        user,
        tokens,
        claims,
        mappedRoles: allowedUser.roles,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'AUTH_ERROR',
          message: error instanceof Error ? error.message : 'Error de autenticación',
        },
      };
    }
  }

  /**
   * Decode JWT ID token
   */
  private decodeIdToken(idToken: string): AzureADIdTokenClaims {
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid ID token format');
    }
    const payload = Buffer.from(parts[1]!, 'base64url').toString('utf8');
    return JSON.parse(payload);
  }

  /**
   * Get user profile from Microsoft Graph
   */
  async getUserProfile(accessToken: string): Promise<AzureADUserProfile> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }

    return response.json() as Promise<AzureADUserProfile>;
  }

  // ==========================================================================
  // WEBAUTHN / BIOMETRIC AUTHENTICATION
  // ==========================================================================

  /**
   * Generate WebAuthn registration options
   */
  async generateRegistrationOptions(
    userId: string,
    email: string,
    displayName: string
  ): Promise<RegistrationOptions> {
    const challenge = crypto.randomBytes(32).toString('base64url');

    // Store challenge
    const webauthnChallenge: WebAuthnChallenge = {
      id: uuidv4(),
      challenge,
      userId,
      type: 'registration',
      expiresAt: new Date(Date.now() + DEFAULT_WEBAUTHN_CONFIG.challengeTimeout),
      createdAt: new Date(),
    };
    webauthnChallenges.set(challenge, webauthnChallenge);

    // Get existing credentials to exclude
    const existingCredentials = this.getUserCredentials(userId);

    return {
      challenge,
      rp: {
        name: DEFAULT_WEBAUTHN_CONFIG.rpName,
        id: DEFAULT_WEBAUTHN_CONFIG.rpId,
      },
      user: {
        id: Buffer.from(userId).toString('base64url'),
        name: email,
        displayName,
      },
      pubKeyCredParams: DEFAULT_WEBAUTHN_CONFIG.allowedAlgorithms.map(alg => ({
        type: 'public-key' as const,
        alg,
      })),
      timeout: DEFAULT_WEBAUTHN_CONFIG.challengeTimeout,
      attestation: DEFAULT_WEBAUTHN_CONFIG.attestation,
      authenticatorSelection: {
        authenticatorAttachment: AuthenticatorType.PLATFORM, // Prefer built-in
        residentKey: 'preferred',
        requireResidentKey: false,
        userVerification: DEFAULT_WEBAUTHN_CONFIG.userVerification,
      },
      excludeCredentials: existingCredentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        transports: cred.transports,
      })),
    };
  }

  /**
   * Verify and save WebAuthn registration
   */
  async verifyRegistration(
    userId: string,
    response: RegistrationResponse,
    deviceName?: string,
    biometricType?: BiometricType
  ): Promise<VerificationResult> {
    try {
      // Get and verify challenge
      const clientData = JSON.parse(
        Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf8')
      );

      const storedChallenge = webauthnChallenges.get(clientData.challenge);
      if (!storedChallenge || storedChallenge.userId !== userId) {
        return { verified: false, error: 'Challenge inválido' };
      }

      if (new Date() > storedChallenge.expiresAt) {
        webauthnChallenges.delete(clientData.challenge);
        return { verified: false, error: 'Challenge expirado' };
      }

      // Parse attestation object (simplified - use @simplewebauthn/server in production)
      const attestationBuffer = Buffer.from(response.response.attestationObject, 'base64url');

      // Extract public key and credential ID (simplified parsing)
      // In production, use proper CBOR decoding
      const credentialId = response.id;
      const publicKey = attestationBuffer.toString('base64');

      // Store credential
      const credential: WebAuthnCredential = {
        id: uuidv4(),
        credentialId,
        userId,
        publicKey,
        counter: 0,
        deviceType: response.authenticatorAttachment || AuthenticatorType.PLATFORM,
        transports: response.response.transports || [],
        biometricType: biometricType || this.detectBiometricType(response),
        deviceName: deviceName || this.generateDeviceName(response),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      webauthnCredentials.set(credential.id, credential);
      webauthnChallenges.delete(clientData.challenge);

      return { verified: true, credential };
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Error de verificación',
      };
    }
  }

  /**
   * Generate WebAuthn authentication options
   */
  async generateAuthenticationOptions(email: string): Promise<AuthenticationOptions | null> {
    const user = this.getAllowedUserByEmail(email);
    if (!user) return null;

    const credentials = this.getUserCredentials(user.id);
    if (credentials.length === 0) return null;

    const challenge = crypto.randomBytes(32).toString('base64url');

    // Store challenge
    const webauthnChallenge: WebAuthnChallenge = {
      id: uuidv4(),
      challenge,
      userId: user.id,
      type: 'authentication',
      expiresAt: new Date(Date.now() + DEFAULT_WEBAUTHN_CONFIG.challengeTimeout),
      createdAt: new Date(),
    };
    webauthnChallenges.set(challenge, webauthnChallenge);

    return {
      challenge,
      timeout: DEFAULT_WEBAUTHN_CONFIG.challengeTimeout,
      rpId: DEFAULT_WEBAUTHN_CONFIG.rpId,
      allowCredentials: credentials.map(cred => ({
        id: cred.credentialId,
        type: 'public-key' as const,
        transports: cred.transports,
      })),
      userVerification: DEFAULT_WEBAUTHN_CONFIG.userVerification,
    };
  }

  /**
   * Verify WebAuthn authentication
   */
  async verifyAuthentication(
    response: AuthenticationResponse
  ): Promise<VerificationResult> {
    try {
      // Parse client data
      const clientData = JSON.parse(
        Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf8')
      );

      // Verify challenge
      const storedChallenge = webauthnChallenges.get(clientData.challenge);
      if (!storedChallenge) {
        return { verified: false, error: 'Challenge inválido' };
      }

      if (new Date() > storedChallenge.expiresAt) {
        webauthnChallenges.delete(clientData.challenge);
        return { verified: false, error: 'Challenge expirado' };
      }

      // Find credential
      let credential: WebAuthnCredential | undefined;
      for (const cred of webauthnCredentials.values()) {
        if (cred.credentialId === response.id) {
          credential = cred;
          break;
        }
      }

      if (!credential) {
        return { verified: false, error: 'Credencial no encontrada' };
      }

      // Verify signature (simplified - use proper crypto in production)
      // In production, verify authenticator data and signature properly

      // Update counter
      const newCounter = credential.counter + 1;
      credential.counter = newCounter;
      credential.lastUsedAt = new Date();
      credential.updatedAt = new Date();
      webauthnCredentials.set(credential.id, credential);

      webauthnChallenges.delete(clientData.challenge);

      return { verified: true, credential, newCounter };
    } catch (error) {
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Error de verificación',
      };
    }
  }

  /**
   * Get user's registered credentials
   */
  getUserCredentials(userId: string): WebAuthnCredential[] {
    const credentials: WebAuthnCredential[] = [];
    for (const cred of webauthnCredentials.values()) {
      if (cred.userId === userId) {
        credentials.push(cred);
      }
    }
    return credentials;
  }

  /**
   * Delete a credential
   */
  deleteCredential(credentialId: string, userId: string): boolean {
    const credential = webauthnCredentials.get(credentialId);
    if (credential && credential.userId === userId) {
      webauthnCredentials.delete(credentialId);
      return true;
    }
    return false;
  }

  /**
   * Detect biometric type from response
   */
  private detectBiometricType(response: RegistrationResponse): BiometricType {
    const attachment = response.authenticatorAttachment;

    if (attachment === AuthenticatorType.CROSS_PLATFORM) {
      return BiometricType.HARDWARE_KEY;
    }

    // Platform authenticator - try to detect type from process.platform (Node.js)
    // This is a simplified detection for server-side
    const platform = typeof process !== 'undefined' ? process.platform : '';
    if (platform === 'darwin') {
      return BiometricType.TOUCH_ID;
    }
    if (platform === 'win32') {
      return BiometricType.WINDOWS_HELLO;
    }

    return BiometricType.FINGERPRINT;
  }

  /**
   * Generate device name
   */
  private generateDeviceName(response: RegistrationResponse): string {
    const attachment = response.authenticatorAttachment;

    if (attachment === AuthenticatorType.CROSS_PLATFORM) {
      return 'Llave de seguridad';
    }

    return 'Este dispositivo';
  }

  // ==========================================================================
  // ALLOWED USERS MANAGEMENT
  // ==========================================================================

  /**
   * Create allowed user
   */
  async createAllowedUser(data: CreateAllowedUserDTO): Promise<AllowedUser> {
    const validation = this.validateEmail(data.email);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const user: AllowedUser = {
      id: uuidv4(),
      email: data.email.toLowerCase(),
      domain: this.extractDomain(data.email),
      firstName: data.firstName,
      lastName: data.lastName,
      department: data.department,
      jobTitle: data.jobTitle,
      roles: data.roles || ['user'],
      permissions: data.permissions || [],
      isActive: true,
      allowedBiometrics: data.allowedBiometrics ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      loginCount: 0,
    };

    allowedUsers.set(user.id, user);
    return user;
  }

  /**
   * Update allowed user
   */
  async updateAllowedUser(userId: string, data: UpdateAllowedUserDTO): Promise<AllowedUser | null> {
    const user = allowedUsers.get(userId);
    if (!user) return null;

    const updated: AllowedUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };

    allowedUsers.set(userId, updated);
    return updated;
  }

  /**
   * Get allowed user by email
   */
  getAllowedUserByEmail(email: string): AllowedUser | null {
    const normalizedEmail = email.toLowerCase();
    for (const user of allowedUsers.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
    }
    return null;
  }

  /**
   * Get allowed user by ID
   */
  getAllowedUser(userId: string): AllowedUser | null {
    return allowedUsers.get(userId) || null;
  }

  /**
   * List all allowed users
   */
  listAllowedUsers(): AllowedUser[] {
    return Array.from(allowedUsers.values());
  }

  /**
   * Deactivate user
   */
  deactivateUser(userId: string): boolean {
    const user = allowedUsers.get(userId);
    if (user) {
      user.isActive = false;
      user.updatedAt = new Date();
      allowedUsers.set(userId, user);
      return true;
    }
    return false;
  }

  /**
   * Activate user
   */
  activateUser(userId: string): boolean {
    const user = allowedUsers.get(userId);
    if (user) {
      user.isActive = true;
      user.updatedAt = new Date();
      allowedUsers.set(userId, user);
      return true;
    }
    return false;
  }

  // ==========================================================================
  // DOMAIN MANAGEMENT
  // ==========================================================================

  /**
   * Add allowed domain
   */
  addAllowedDomain(
    domain: string,
    organizationName: string,
    options?: {
      autoProvision?: boolean;
      defaultRoles?: string[];
    }
  ): AllowedDomain {
    const entry: AllowedDomain = {
      id: uuidv4(),
      domain: domain.toLowerCase(),
      organizationName,
      isActive: true,
      autoProvision: options?.autoProvision ?? false,
      defaultRoles: options?.defaultRoles || ['user'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    allowedDomains.set(entry.domain, entry);
    return entry;
  }

  /**
   * List allowed domains
   */
  listAllowedDomains(): AllowedDomain[] {
    return Array.from(allowedDomains.values());
  }
}

// Export singleton
export const enterpriseAuthService = new EnterpriseAuthService();
