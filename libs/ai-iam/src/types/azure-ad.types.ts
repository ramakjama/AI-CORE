/**
 * Azure AD / Microsoft Entra ID Types
 * Enterprise SSO with Microsoft 365
 */

// ============================================================================
// AZURE AD CONFIGURATION
// ============================================================================

/**
 * Azure AD tenant configuration
 */
export interface AzureADConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  postLogoutRedirectUri?: string;
  scopes: string[];
  authority?: string;
  allowedDomains: string[];
  requireMFA?: boolean;
  groupMapping?: AzureADGroupMapping;
}

/**
 * Default Azure AD configuration for Soriano Mediadores
 */
export const DEFAULT_AZURE_AD_CONFIG: Partial<AzureADConfig> = {
  scopes: ['openid', 'profile', 'email', 'User.Read', 'GroupMember.Read.All'],
  allowedDomains: ['sorianomediadores.es'],
  requireMFA: true,
  authority: 'https://login.microsoftonline.com'
};

/**
 * Group to role mapping
 */
export interface AzureADGroupMapping {
  [groupId: string]: {
    roleCode: string;
    permissions?: string[];
  };
}

// ============================================================================
// USER INTERFACES
// ============================================================================

/**
 * Azure AD user profile from Microsoft Graph
 */
export interface AzureADUserProfile {
  id: string;
  displayName: string;
  givenName?: string;
  surname?: string;
  mail: string;
  userPrincipalName: string;
  jobTitle?: string;
  department?: string;
  officeLocation?: string;
  mobilePhone?: string;
  businessPhones?: string[];
  preferredLanguage?: string;
  photo?: string;
}

/**
 * Azure AD group
 */
export interface AzureADGroup {
  id: string;
  displayName: string;
  description?: string;
  mail?: string;
  groupTypes: string[];
  securityEnabled: boolean;
}

/**
 * Azure AD token response
 */
export interface AzureADTokenResponse {
  accessToken: string;
  refreshToken?: string;
  idToken: string;
  expiresIn: number;
  tokenType: string;
  scope: string;
}

/**
 * ID token claims from Azure AD
 */
export interface AzureADIdTokenClaims {
  aud: string;
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  aio?: string;
  amr?: string[];
  email: string;
  family_name?: string;
  given_name?: string;
  idp?: string;
  ipaddr?: string;
  name: string;
  nonce?: string;
  oid: string;
  preferred_username: string;
  rh?: string;
  sub: string;
  tid: string;
  unique_name?: string;
  upn?: string;
  uti?: string;
  ver: string;
  groups?: string[];
  roles?: string[];
}

// ============================================================================
// AUTH FLOW INTERFACES
// ============================================================================

/**
 * Authorization URL parameters
 */
export interface AuthorizationUrlParams {
  state: string;
  nonce: string;
  codeChallenge?: string;
  codeChallengeMethod?: 'S256' | 'plain';
  prompt?: 'login' | 'consent' | 'select_account' | 'none';
  loginHint?: string;
  domainHint?: string;
}

/**
 * Token exchange request
 */
export interface TokenExchangeRequest {
  code: string;
  codeVerifier?: string;
  state: string;
}

/**
 * Azure AD login result
 */
export interface AzureADLoginResult {
  success: boolean;
  user?: AzureADUserProfile;
  groups?: AzureADGroup[];
  tokens?: AzureADTokenResponse;
  claims?: AzureADIdTokenClaims;
  mappedRoles?: string[];
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

/**
 * OAuth state for CSRF protection
 */
export interface OAuthState {
  id: string;
  state: string;
  nonce: string;
  codeVerifier?: string;
  redirectUri: string;
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// ALLOWED USERS DATABASE
// ============================================================================

/**
 * Allowed user entry (whitelist)
 */
export interface AllowedUser {
  id: string;
  email: string;
  domain: string;
  azureObjectId?: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  roles: string[];
  permissions: string[];
  isActive: boolean;
  allowedBiometrics: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastLoginAt?: Date;
  loginCount: number;
}

/**
 * Domain whitelist entry
 */
export interface AllowedDomain {
  id: string;
  domain: string;
  organizationName: string;
  isActive: boolean;
  autoProvision: boolean;
  defaultRoles: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create allowed user DTO
 */
export interface CreateAllowedUserDTO {
  email: string;
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  roles?: string[];
  permissions?: string[];
  allowedBiometrics?: boolean;
}

/**
 * Update allowed user DTO
 */
export interface UpdateAllowedUserDTO {
  firstName?: string;
  lastName?: string;
  department?: string;
  jobTitle?: string;
  roles?: string[];
  permissions?: string[];
  isActive?: boolean;
  allowedBiometrics?: boolean;
}
