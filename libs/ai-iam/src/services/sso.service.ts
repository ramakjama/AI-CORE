// ============================================================================
// AI-IAM SSO Service - Single Sign-On (SAML 2.0 & OIDC)
// ============================================================================

import { v4 as uuidv4 } from 'uuid';
import { Issuer, Client, generators, TokenSet } from 'openid-client';
import {
  AuthProvider,
  SAMLConfig,
  OIDCConfig,
  ExternalIdentity,
  ServiceResult,
  User,
  UserStatus,
  AuditEventType,
  SAMLAttributeMapping,
  OIDCAttributeMapping
} from '../types';

// Configuration interfaces
interface SSOServiceConfig {
  baseUrl: string;
  callbackPath: string;
  defaultRedirectUri?: string;
}

interface SAMLLoginResult {
  redirectUrl: string;
  requestId: string;
}

interface OIDCLoginResult {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier?: string;
}

interface SSOCallbackResult {
  user: Partial<User>;
  externalId: string;
  provider: AuthProvider;
  email: string;
  profile: {
    firstName?: string;
    lastName?: string;
    displayName?: string;
    picture?: string;
    groups?: string[];
  };
  rawAttributes: Record<string, unknown>;
}

const DEFAULT_CONFIG: SSOServiceConfig = {
  baseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  callbackPath: '/auth/sso/callback',
  defaultRedirectUri: '/'
};

/**
 * SSO Service
 * Handles Single Sign-On with SAML 2.0 and OpenID Connect protocols
 */
export class SSOService {
  private config: SSOServiceConfig;

  // In-memory stores (replace with database in production)
  private samlConfigs: Map<string, SAMLConfig> = new Map();
  private oidcConfigs: Map<string, OIDCConfig> = new Map();
  private oidcClients: Map<string, Client> = new Map();
  private externalIdentities: Map<string, ExternalIdentity[]> = new Map(); // userId -> identities
  private pendingRequests: Map<string, {
    providerId: string;
    state: string;
    nonce?: string;
    codeVerifier?: string;
    createdAt: Date;
  }> = new Map();

  constructor(config: Partial<SSOServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ============================================================================
  // SAML 2.0
  // ============================================================================

  /**
   * Initiate SAML login
   */
  async initiateSAMLLogin(providerId: string): Promise<ServiceResult<SAMLLoginResult>> {
    const config = this.samlConfigs.get(providerId);
    if (!config || !config.enabled) {
      return {
        success: false,
        error: {
          code: 'SAML_PROVIDER_NOT_FOUND',
          message: 'SAML provider not found or disabled'
        }
      };
    }

    try {
      const requestId = `_${uuidv4()}`;
      const issueInstant = new Date().toISOString();

      // Build SAML AuthnRequest
      const authnRequest = this.buildSAMLAuthnRequest(config, requestId, issueInstant);

      // Encode and build redirect URL
      const encodedRequest = Buffer.from(authnRequest).toString('base64');
      const redirectUrl = `${config.ssoUrl}?SAMLRequest=${encodeURIComponent(encodedRequest)}`;

      // Store pending request
      this.pendingRequests.set(requestId, {
        providerId,
        state: requestId,
        createdAt: new Date()
      });

      return {
        success: true,
        data: {
          redirectUrl,
          requestId
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAML_INIT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to initiate SAML login'
        }
      };
    }
  }

  /**
   * Handle SAML callback response
   */
  async handleSAMLCallback(samlResponse: string): Promise<ServiceResult<SSOCallbackResult>> {
    try {
      // Decode SAML response
      const decodedResponse = Buffer.from(samlResponse, 'base64').toString('utf-8');

      // Parse SAML response (simplified - in production use a proper SAML library)
      const parsedResponse = this.parseSAMLResponse(decodedResponse);

      if (!parsedResponse.success) {
        return {
          success: false,
          error: {
            code: 'SAML_PARSE_ERROR',
            message: parsedResponse.error || 'Failed to parse SAML response'
          }
        };
      }

      // Find the SAML config for this issuer
      const config = this.findSAMLConfigByEntityId(parsedResponse.issuer);
      if (!config) {
        return {
          success: false,
          error: {
            code: 'SAML_ISSUER_NOT_FOUND',
            message: 'SAML issuer not found in configuration'
          }
        };
      }

      // Map attributes to user profile
      const mappedUser = this.mapSAMLAttributes(
        parsedResponse.attributes,
        config.attributeMapping
      );

      const result: SSOCallbackResult = {
        user: {
          email: mappedUser.email,
          status: UserStatus.ACTIVE
        },
        externalId: parsedResponse.nameId,
        provider: AuthProvider.SAML,
        email: mappedUser.email,
        profile: {
          firstName: mappedUser.firstName,
          lastName: mappedUser.lastName,
          displayName: mappedUser.displayName,
          groups: mappedUser.groups
        },
        rawAttributes: parsedResponse.attributes
      };

      this.logAuditEvent(undefined, AuditEventType.SSO_LOGIN, {
        provider: AuthProvider.SAML,
        providerId: config.id,
        email: mappedUser.email
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SAML_CALLBACK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process SAML callback'
        }
      };
    }
  }

  /**
   * Build SAML AuthnRequest XML
   */
  private buildSAMLAuthnRequest(
    config: SAMLConfig,
    requestId: string,
    issueInstant: string
  ): string {
    const callbackUrl = `${this.config.baseUrl}${this.config.callbackPath}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest
    xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
    ID="${requestId}"
    Version="2.0"
    IssueInstant="${issueInstant}"
    Destination="${config.ssoUrl}"
    AssertionConsumerServiceURL="${callbackUrl}"
    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
    <saml:Issuer>${config.entityId}</saml:Issuer>
    <samlp:NameIDPolicy
        Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
        AllowCreate="true"/>
</samlp:AuthnRequest>`;
  }

  /**
   * Parse SAML response (simplified)
   */
  private parseSAMLResponse(xml: string): {
    success: boolean;
    error?: string;
    nameId: string;
    issuer: string;
    attributes: Record<string, unknown>;
  } {
    // This is a simplified parser - in production, use a proper SAML library
    // like passport-saml or saml2-js with proper signature validation

    try {
      // Extract NameID
      const nameIdMatch = xml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/);
      const nameId = nameIdMatch ? nameIdMatch[1] : '';

      // Extract Issuer
      const issuerMatch = xml.match(/<saml:Issuer[^>]*>([^<]+)<\/saml:Issuer>/);
      const issuer = issuerMatch ? issuerMatch[1] : '';

      // Extract attributes (simplified)
      const attributes: Record<string, string> = {};
      const attrRegex = /<saml:Attribute[^>]*Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g;
      let match;
      while ((match = attrRegex.exec(xml)) !== null) {
        attributes[match[1]] = match[2];
      }

      return {
        success: true,
        nameId,
        issuer,
        attributes
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Parse error',
        nameId: '',
        issuer: '',
        attributes: {}
      };
    }
  }

  /**
   * Map SAML attributes to user profile
   */
  private mapSAMLAttributes(
    attributes: Record<string, unknown>,
    mapping: SAMLAttributeMapping
  ): {
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    groups?: string[];
  } {
    return {
      email: String(attributes[mapping.email] || ''),
      firstName: mapping.firstName ? String(attributes[mapping.firstName] || '') : undefined,
      lastName: mapping.lastName ? String(attributes[mapping.lastName] || '') : undefined,
      displayName: mapping.displayName ? String(attributes[mapping.displayName] || '') : undefined,
      groups: mapping.groups ? this.parseGroups(attributes[mapping.groups]) : undefined
    };
  }

  /**
   * Find SAML config by entity ID
   */
  private findSAMLConfigByEntityId(entityId: string): SAMLConfig | undefined {
    return Array.from(this.samlConfigs.values()).find(
      c => c.entityId === entityId
    );
  }

  // ============================================================================
  // OIDC (OpenID Connect)
  // ============================================================================

  /**
   * Initiate OIDC login
   */
  async initiateOIDCLogin(providerId: string): Promise<ServiceResult<OIDCLoginResult>> {
    const config = this.oidcConfigs.get(providerId);
    if (!config || !config.enabled) {
      return {
        success: false,
        error: {
          code: 'OIDC_PROVIDER_NOT_FOUND',
          message: 'OIDC provider not found or disabled'
        }
      };
    }

    try {
      // Get or create OIDC client
      let client = this.oidcClients.get(providerId);
      if (!client) {
        const issuer = await Issuer.discover(config.issuer);
        client = new issuer.Client({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          redirect_uris: [`${this.config.baseUrl}${this.config.callbackPath}`],
          response_types: [config.responseType || 'code']
        });
        this.oidcClients.set(providerId, client);
      }

      // Generate state and nonce
      const state = generators.state();
      const nonce = generators.nonce();
      const codeVerifier = generators.codeVerifier();
      const codeChallenge = generators.codeChallenge(codeVerifier);

      // Build authorization URL
      const authorizationUrl = client.authorizationUrl({
        scope: config.scopes.join(' '),
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });

      // Store pending request
      this.pendingRequests.set(state, {
        providerId,
        state,
        nonce,
        codeVerifier,
        createdAt: new Date()
      });

      return {
        success: true,
        data: {
          authorizationUrl,
          state,
          nonce,
          codeVerifier
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OIDC_INIT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to initiate OIDC login'
        }
      };
    }
  }

  /**
   * Handle OIDC callback
   */
  async handleOIDCCallback(
    code: string,
    state: string
  ): Promise<ServiceResult<SSOCallbackResult>> {
    // Retrieve pending request
    const pendingRequest = this.pendingRequests.get(state);
    if (!pendingRequest) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATE',
          message: 'Invalid or expired state parameter'
        }
      };
    }

    // Check expiration (5 minutes)
    const age = Date.now() - pendingRequest.createdAt.getTime();
    if (age > 5 * 60 * 1000) {
      this.pendingRequests.delete(state);
      return {
        success: false,
        error: {
          code: 'STATE_EXPIRED',
          message: 'State parameter has expired'
        }
      };
    }

    const config = this.oidcConfigs.get(pendingRequest.providerId);
    if (!config) {
      return {
        success: false,
        error: {
          code: 'OIDC_CONFIG_NOT_FOUND',
          message: 'OIDC configuration not found'
        }
      };
    }

    try {
      const client = this.oidcClients.get(pendingRequest.providerId);
      if (!client) {
        return {
          success: false,
          error: {
            code: 'OIDC_CLIENT_NOT_FOUND',
            message: 'OIDC client not initialized'
          }
        };
      }

      // Exchange code for tokens
      const callbackUrl = `${this.config.baseUrl}${this.config.callbackPath}`;
      const tokenSet: TokenSet = await client.callback(
        callbackUrl,
        { code, state },
        {
          state,
          nonce: pendingRequest.nonce,
          code_verifier: pendingRequest.codeVerifier
        }
      );

      // Clean up pending request
      this.pendingRequests.delete(state);

      // Get user info
      const userInfo = await client.userinfo(tokenSet.access_token!);

      // Map claims to user profile
      const mappedUser = this.mapOIDCClaims(userInfo, config.attributeMapping);

      // Determine provider type
      let provider = AuthProvider.OIDC;
      if (config.issuer.includes('microsoft') || config.issuer.includes('azure')) {
        provider = AuthProvider.AZURE_AD;
      } else if (config.issuer.includes('google')) {
        provider = AuthProvider.GOOGLE;
      }

      const result: SSOCallbackResult = {
        user: {
          email: mappedUser.email,
          status: UserStatus.ACTIVE
        },
        externalId: String(userInfo.sub),
        provider,
        email: mappedUser.email,
        profile: {
          firstName: mappedUser.firstName,
          lastName: mappedUser.lastName,
          displayName: mappedUser.displayName,
          picture: mappedUser.picture,
          groups: mappedUser.groups
        },
        rawAttributes: userInfo as Record<string, unknown>
      };

      this.logAuditEvent(undefined, AuditEventType.SSO_LOGIN, {
        provider,
        providerId: config.id,
        email: mappedUser.email,
        sub: userInfo.sub
      });

      return {
        success: true,
        data: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'OIDC_CALLBACK_ERROR',
          message: error instanceof Error ? error.message : 'Failed to process OIDC callback'
        }
      };
    }
  }

  /**
   * Map OIDC claims to user profile
   */
  private mapOIDCClaims(
    claims: Record<string, unknown>,
    mapping: OIDCAttributeMapping
  ): {
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    picture?: string;
    groups?: string[];
  } {
    return {
      email: String(claims[mapping.email] || claims.email || ''),
      firstName: mapping.firstName
        ? String(claims[mapping.firstName] || claims.given_name || '')
        : undefined,
      lastName: mapping.lastName
        ? String(claims[mapping.lastName] || claims.family_name || '')
        : undefined,
      displayName: mapping.displayName
        ? String(claims[mapping.displayName] || claims.name || '')
        : undefined,
      picture: mapping.picture
        ? String(claims[mapping.picture] || claims.picture || '')
        : undefined,
      groups: mapping.groups ? this.parseGroups(claims[mapping.groups]) : undefined
    };
  }

  // ============================================================================
  // EXTERNAL IDENTITY MANAGEMENT
  // ============================================================================

  /**
   * Link external identity to user
   */
  async linkExternalIdentity(
    userId: string,
    provider: AuthProvider,
    externalId: string,
    email?: string,
    displayName?: string
  ): Promise<ServiceResult<ExternalIdentity>> {
    // Check if identity already linked
    const existingIdentities = this.externalIdentities.get(userId) || [];
    const existing = existingIdentities.find(
      i => i.provider === provider && i.externalId === externalId
    );

    if (existing) {
      return {
        success: false,
        error: {
          code: 'IDENTITY_ALREADY_LINKED',
          message: 'This external identity is already linked'
        }
      };
    }

    // Check if external ID is linked to another user
    for (const [otherUserId, identities] of this.externalIdentities.entries()) {
      if (otherUserId !== userId) {
        const conflict = identities.find(
          i => i.provider === provider && i.externalId === externalId
        );
        if (conflict) {
          return {
            success: false,
            error: {
              code: 'IDENTITY_LINKED_TO_OTHER_USER',
              message: 'This external identity is linked to another user'
            }
          };
        }
      }
    }

    const identity: ExternalIdentity = {
      id: uuidv4(),
      userId,
      provider,
      externalId,
      email,
      displayName,
      linkedAt: new Date()
    };

    existingIdentities.push(identity);
    this.externalIdentities.set(userId, existingIdentities);

    return {
      success: true,
      data: identity
    };
  }

  /**
   * Unlink external identity from user
   */
  async unlinkExternalIdentity(
    userId: string,
    provider: AuthProvider
  ): Promise<ServiceResult<void>> {
    const identities = this.externalIdentities.get(userId);
    if (!identities) {
      return {
        success: false,
        error: {
          code: 'NO_IDENTITIES_FOUND',
          message: 'No external identities found for user'
        }
      };
    }

    const index = identities.findIndex(i => i.provider === provider);
    if (index === -1) {
      return {
        success: false,
        error: {
          code: 'IDENTITY_NOT_FOUND',
          message: 'External identity not found'
        }
      };
    }

    identities.splice(index, 1);
    this.externalIdentities.set(userId, identities);

    return { success: true };
  }

  /**
   * Get linked identities for user
   */
  async getLinkedIdentities(userId: string): Promise<ServiceResult<ExternalIdentity[]>> {
    const identities = this.externalIdentities.get(userId) || [];
    return {
      success: true,
      data: identities
    };
  }

  /**
   * Find user by external identity
   */
  findUserByExternalIdentity(
    provider: AuthProvider,
    externalId: string
  ): { userId: string; identity: ExternalIdentity } | undefined {
    for (const [userId, identities] of this.externalIdentities.entries()) {
      const identity = identities.find(
        i => i.provider === provider && i.externalId === externalId
      );
      if (identity) {
        return { userId, identity };
      }
    }
    return undefined;
  }

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  /**
   * Register SAML configuration
   */
  registerSAMLConfig(config: SAMLConfig): void {
    this.samlConfigs.set(config.id, config);
  }

  /**
   * Register OIDC configuration
   */
  registerOIDCConfig(config: OIDCConfig): void {
    this.oidcConfigs.set(config.id, config);
    // Clear cached client to force re-initialization
    this.oidcClients.delete(config.id);
  }

  /**
   * Get SAML configuration
   */
  getSAMLConfig(providerId: string): SAMLConfig | undefined {
    return this.samlConfigs.get(providerId);
  }

  /**
   * Get OIDC configuration
   */
  getOIDCConfig(providerId: string): OIDCConfig | undefined {
    return this.oidcConfigs.get(providerId);
  }

  /**
   * List all SSO providers
   */
  listProviders(): {
    saml: Array<{ id: string; name: string; enabled: boolean }>;
    oidc: Array<{ id: string; name: string; enabled: boolean }>;
  } {
    return {
      saml: Array.from(this.samlConfigs.values()).map(c => ({
        id: c.id,
        name: c.name,
        enabled: c.enabled
      })),
      oidc: Array.from(this.oidcConfigs.values()).map(c => ({
        id: c.id,
        name: c.name,
        enabled: c.enabled
      }))
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Parse groups from various formats
   */
  private parseGroups(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(String);
    if (typeof value === 'string') {
      // Try JSON parse first
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed.map(String);
      } catch {
        // Split by comma or semicolon
        return value.split(/[,;]/).map(s => s.trim()).filter(Boolean);
      }
    }
    return [];
  }

  /**
   * Log audit event
   */
  private logAuditEvent(
    userId: string | undefined,
    type: AuditEventType,
    details: Record<string, unknown>
  ): void {
    console.log(`[SSO AUDIT] ${type} - User: ${userId || 'unknown'}`, details);
  }

  /**
   * Clean up expired pending requests
   */
  cleanupExpiredRequests(): void {
    const now = Date.now();
    const expirationMs = 5 * 60 * 1000; // 5 minutes

    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.createdAt.getTime() > expirationMs) {
        this.pendingRequests.delete(key);
      }
    }
  }
}

// Export singleton instance
export const ssoService = new SSOService();
