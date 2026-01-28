import * as crypto from 'crypto';

export class EncryptionUtil {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32; // 256 bits
  private static readonly IV_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;
  private static readonly TAG_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  /**
   * Genera una clave de encriptación a partir de una contraseña
   */
  private static deriveKey(password: string, salt: Buffer): Buffer {
    return crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, 'sha512');
  }

  /**
   * Obtiene la clave de encriptación desde variable de entorno
   */
  private static getEncryptionKey(): string {
    const key = process.env.CERTIFICATE_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('CERTIFICATE_ENCRYPTION_KEY not set in environment variables');
    }
    return key;
  }

  /**
   * Encripta datos usando AES-256-GCM
   * @param data Datos a encriptar (string o Buffer)
   * @returns Datos encriptados en formato: salt:iv:encryptedData:authTag (base64)
   */
  static encrypt(data: string | Buffer): string {
    try {
      // Generar salt aleatorio
      const salt = crypto.randomBytes(this.SALT_LENGTH);

      // Derivar clave de la contraseña maestra
      const key = this.deriveKey(this.getEncryptionKey(), salt);

      // Generar IV aleatorio
      const iv = crypto.randomBytes(this.IV_LENGTH);

      // Crear cipher
      const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);

      // Convertir data a Buffer si es string
      const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');

      // Encriptar
      const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);

      // Obtener authentication tag
      const authTag = cipher.getAuthTag();

      // Combinar salt:iv:encrypted:authTag y convertir a base64
      const combined = Buffer.concat([
        salt,
        iv,
        encrypted,
        authTag,
      ]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Desencripta datos encriptados con encrypt()
   * @param encryptedData Datos encriptados en formato base64
   * @returns Datos desencriptados como Buffer
   */
  static decrypt(encryptedData: string): Buffer {
    try {
      // Decodificar de base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extraer componentes
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const authTag = combined.subarray(combined.length - this.TAG_LENGTH);
      const encrypted = combined.subarray(
        this.SALT_LENGTH + this.IV_LENGTH,
        combined.length - this.TAG_LENGTH,
      );

      // Derivar clave
      const key = this.deriveKey(this.getEncryptionKey(), salt);

      // Crear decipher
      const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Desencriptar
      const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Desencripta y devuelve como string UTF-8
   */
  static decryptToString(encryptedData: string): string {
    return this.decrypt(encryptedData).toString('utf8');
  }

  /**
   * Genera un hash SHA-256 de los datos
   */
  static hash(data: string | Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    return hash.digest('hex');
  }

  /**
   * Genera un fingerprint SHA-256 en formato legible
   */
  static generateFingerprint(data: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(data);
    const hex = hash.digest('hex').toUpperCase();

    // Formato: XX:XX:XX:XX:...
    return hex.match(/.{1,2}/g)?.join(':') || hex;
  }

  /**
   * Verifica si los datos encriptados son válidos
   */
  static canDecrypt(encryptedData: string): boolean {
    try {
      this.decrypt(encryptedData);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Genera una contraseña aleatoria segura
   */
  static generateSecurePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomBytes = crypto.randomBytes(length);
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }

  /**
   * Encripta específicamente para certificados PKCS#12
   */
  static encryptCertificate(pfxBuffer: Buffer, password: string): {
    encryptedPfx: string;
    encryptedPassword: string;
    fingerprint: string;
  } {
    return {
      encryptedPfx: this.encrypt(pfxBuffer),
      encryptedPassword: this.encrypt(password),
      fingerprint: this.generateFingerprint(pfxBuffer),
    };
  }

  /**
   * Desencripta certificado PKCS#12
   */
  static decryptCertificate(encryptedPfx: string, encryptedPassword: string): {
    pfxBuffer: Buffer;
    password: string;
  } {
    return {
      pfxBuffer: this.decrypt(encryptedPfx),
      password: this.decryptToString(encryptedPassword),
    };
  }
}
