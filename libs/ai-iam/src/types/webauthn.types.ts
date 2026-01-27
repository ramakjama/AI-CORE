/**
 * WebAuthn / FIDO2 Types for Biometric Authentication
 * Supports fingerprint, Face ID, Windows Hello, hardware keys
 */

// ============================================================================
// WEBAUTHN ENUMS
// ============================================================================

export enum AuthenticatorType {
  PLATFORM = 'platform',           // Built-in (Touch ID, Face ID, Windows Hello)
  CROSS_PLATFORM = 'cross-platform' // External (YubiKey, etc.)
}

export enum AuthenticatorTransport {
  USB = 'usb',
  NFC = 'nfc',
  BLE = 'ble',
  INTERNAL = 'internal',
  HYBRID = 'hybrid'
}

export enum UserVerification {
  REQUIRED = 'required',
  PREFERRED = 'preferred',
  DISCOURAGED = 'discouraged'
}

export enum AttestationConveyance {
  NONE = 'none',
  INDIRECT = 'indirect',
  DIRECT = 'direct',
  ENTERPRISE = 'enterprise'
}

export enum BiometricType {
  FINGERPRINT = 'FINGERPRINT',
  FACE = 'FACE',
  IRIS = 'IRIS',
  VOICE = 'VOICE',
  WINDOWS_HELLO = 'WINDOWS_HELLO',
  TOUCH_ID = 'TOUCH_ID',
  FACE_ID = 'FACE_ID',
  HARDWARE_KEY = 'HARDWARE_KEY'
}

// ============================================================================
// CREDENTIAL INTERFACES
// ============================================================================

/**
 * Stored WebAuthn credential
 */
export interface WebAuthnCredential {
  id: string;
  credentialId: string;
  userId: string;
  publicKey: string;
  counter: number;
  deviceType: AuthenticatorType;
  transports: AuthenticatorTransport[];
  biometricType?: BiometricType;
  aaguid?: string;
  deviceName?: string;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * WebAuthn registration options (sent to client)
 */
export interface RegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout: number;
  attestation: AttestationConveyance;
  authenticatorSelection: {
    authenticatorAttachment?: AuthenticatorType;
    residentKey?: 'required' | 'preferred' | 'discouraged';
    requireResidentKey?: boolean;
    userVerification: UserVerification;
  };
  excludeCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }>;
}

/**
 * WebAuthn authentication options (sent to client)
 */
export interface AuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials?: Array<{
    id: string;
    type: 'public-key';
    transports?: AuthenticatorTransport[];
  }>;
  userVerification: UserVerification;
}

/**
 * Registration response from client
 */
export interface RegistrationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: AuthenticatorTransport[];
  };
  authenticatorAttachment?: AuthenticatorType;
  clientExtensionResults: Record<string, unknown>;
}

/**
 * Authentication response from client
 */
export interface AuthenticationResponse {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  };
  authenticatorAttachment?: AuthenticatorType;
  clientExtensionResults: Record<string, unknown>;
}

/**
 * Verification result
 */
export interface VerificationResult {
  verified: boolean;
  credential?: WebAuthnCredential;
  newCounter?: number;
  error?: string;
}

// ============================================================================
// CHALLENGE INTERFACES
// ============================================================================

/**
 * Stored challenge for verification
 */
export interface WebAuthnChallenge {
  id: string;
  challenge: string;
  userId?: string;
  type: 'registration' | 'authentication';
  expiresAt: Date;
  createdAt: Date;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * WebAuthn service configuration
 */
export interface WebAuthnConfig {
  rpName: string;
  rpId: string;
  origin: string;
  challengeTimeout: number;
  attestation: AttestationConveyance;
  userVerification: UserVerification;
  allowedAlgorithms: number[];
}

export const DEFAULT_WEBAUTHN_CONFIG: WebAuthnConfig = {
  rpName: 'AI-CORE SOBI',
  rpId: 'sorianomediadores.es',
  origin: 'https://app.sorianomediadores.es',
  challengeTimeout: 60000,
  attestation: AttestationConveyance.NONE,
  userVerification: UserVerification.PREFERRED,
  allowedAlgorithms: [-7, -257] // ES256, RS256
};
