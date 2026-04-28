import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;   // 96-bit nonce — recommended for GCM
const TAG_BYTES = 16;  // 128-bit auth tag

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly logger = new Logger(EncryptionService.name);
  private key!: Buffer;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const raw = this.config.get<string>('FIELD_ENCRYPTION_KEY') ?? '';

    // Accept either a 64-char hex string (32 bytes) or a raw 32-byte key
    if (raw.length === 64 && /^[0-9a-f]+$/i.test(raw)) {
      this.key = Buffer.from(raw, 'hex');
    } else if (Buffer.byteLength(raw) === 32) {
      this.key = Buffer.from(raw);
    } else {
      this.logger.warn(
        'FIELD_ENCRYPTION_KEY is missing or invalid — sensitive field encryption is DISABLED. ' +
        'Set a 64-char hex key to enable.',
      );
      // Use a deterministic zero key so the app starts in dev without a key.
      // Encrypted values stored without a real key cannot be decrypted after one is set.
      this.key = Buffer.alloc(32, 0);
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_BYTES });
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    // Format: base64(iv).base64(ciphertext).base64(tag)
    return `${iv.toString('base64')}.${ciphertext.toString('base64')}.${tag.toString('base64')}`;
  }

  decrypt(encrypted: string): string {
    const parts = encrypted.split('.');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');

    const [ivB64, ciphertextB64, tagB64] = parts as [string, string, string];
    const iv = Buffer.from(ivB64, 'base64');
    const ciphertext = Buffer.from(ciphertextB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');

    if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) {
      throw new Error('Invalid encrypted format');
    }

    const decipher = createDecipheriv(ALGORITHM, this.key, iv, { authTagLength: TAG_BYTES });
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  }

  /** Constant-time equality check to avoid timing attacks when comparing encrypted values. */
  safeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
