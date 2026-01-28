export interface Certificate {
  id: string;
  pfxBuffer: Buffer;
  password: string;
  info: CertificateInfo;
}

export interface CertificateInfo {
  subject: {
    commonName: string;
    organization: string;
    organizationalUnit?: string;
    country: string;
    serialNumber: string; // NIF/CIF
  };
  issuer: {
    commonName: string;
    organization: string;
    country: string;
  };
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
  publicKey: string;
  version: number;
}

export interface CertificateValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  details: {
    isExpired: boolean;
    isNotYetValid: boolean;
    daysUntilExpiration: number;
    isSelfSigned: boolean;
    isRevoked?: boolean;
    issuerValid: boolean;
  };
}
