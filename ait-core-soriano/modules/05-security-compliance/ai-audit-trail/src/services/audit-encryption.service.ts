import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuditEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor(private configService: ConfigService) {
    const encryptionKey = this.configService.get<string>('AUDIT_ENCRYPTION_KEY') || 'default-audit-encryption-key-change-in-production';
    this.key = createHash('sha256').update(encryptionKey).digest();
  }

  encrypt(data: any): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);
    
    const jsonData = JSON.stringify(data);
    let encrypted = cipher.update(jsonData, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): any {
    const decipher = createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  generateChecksum(data: any): string {
    const jsonData = JSON.stringify(data);
    return createHash('sha256').update(jsonData).digest('hex');
  }

  verifyChecksum(data: any, checksum: string): boolean {
    const calculatedChecksum = this.generateChecksum(data);
    return calculatedChecksum === checksum;
  }
}
