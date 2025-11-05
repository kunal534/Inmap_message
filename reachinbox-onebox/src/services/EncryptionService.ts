import crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private secretKey: Buffer;

  constructor() {
    const keyString = process.env.ENCRYPTION_KEY || 'default-encryption-key-please-change-in-production';
    this.secretKey = crypto.scryptSync(keyString, 'salt', 32);
  }

  encrypt(text: string): { encrypted: string; iv: string; authTag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Cast to any to access getAuthTag
    const authTag = (cipher as any).getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  decrypt(encrypted: string, iv: string, authTag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.secretKey,
      Buffer.from(iv, 'hex')
    );

    // Cast to any to access setAuthTag
    (decipher as any).setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
