import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { config } from '../config.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT = 'ts6-webui-enc-v1';

let encryptionKey: Buffer | null = null;

function getKey(): Buffer {
  if (encryptionKey) return encryptionKey;

  const isProduction = process.env.NODE_ENV === 'production';

  if (!process.env.ENCRYPTION_KEY) {
    if (isProduction) {
      // 生产环境强制要求独立的加密密钥：回落 JWT_SECRET 会让密钥轮换/泄露互相牵连，
      // 且 JWT_SECRET 常见被写成默认值，加密等同于无保护。直接终止进程，避免带病启动。
      console.error(
        '[FATAL] 生产环境未设置 ENCRYPTION_KEY 环境变量。' +
        '字段加密必须有独立的 32 字节以上随机密钥，禁止回落到 JWT_SECRET。' +
        '请执行：export ENCRYPTION_KEY="$(openssl rand -hex 32)" 后重启服务。',
      );
      process.exit(1);
    }
    console.warn('[WARN] ENCRYPTION_KEY not set. Using JWT_SECRET as fallback for field encryption. Set ENCRYPTION_KEY in production!');
  }

  const source = process.env.ENCRYPTION_KEY || config.jwtSecret;

  // Derive a 32-byte key using scrypt
  encryptionKey = scryptSync(source, SALT, 32);
  return encryptionKey;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns format: `enc:iv:tag:ciphertext` (all hex-encoded).
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted by `encrypt()`.
 * If the string doesn't start with `enc:`, returns it as-is (plaintext migration).
 */
export function decrypt(encrypted: string): string {
  // Support plaintext values (migration: not yet encrypted)
  if (!encrypted.startsWith('enc:')) return encrypted;

  const parts = encrypted.split(':');
  if (parts.length !== 4) throw new Error('Invalid encrypted format');

  const [, ivHex, tagHex, ciphertext] = parts;
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
