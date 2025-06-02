import type { ApiKey } from '@metallichq/types';
import crypto, { CipherGCMTypes } from 'node:crypto';
import util from 'node:util';
import { envVars } from '../utils/index.js';

const encryptionKey: string | undefined = envVars.ENCRYPTION_KEY;
const algorithm: CipherGCMTypes = 'aes-256-gcm';
const encoding: BufferEncoding = 'base64';
const byteLength: number = 32;

function encrypt(str: string): [string, string | null, string | null] {
  if (!encryptionKey) {
    throw new Error('Failed to encrypt: ENCRYPTION_KEY not set');
  } else if (Buffer.from(encryptionKey, encoding).byteLength !== byteLength) {
    throw new Error('Failed to encrypt: ENCRYPTION_KEY must be base64-encoded and 256-bit');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey, encoding), iv);
  let enc = cipher.update(str, 'utf8', encoding);
  enc += cipher.final(encoding);
  return [enc, iv.toString(encoding), cipher.getAuthTag().toString(encoding)];
}

function decrypt(enc: string, iv: string, authTag: string): string {
  if (!encryptionKey) {
    throw new Error('Failed to decrypt: ENCRYPTION_KEY not set');
  } else if (Buffer.from(encryptionKey, encoding).byteLength !== byteLength) {
    throw new Error('Failed to decrypt: ENCRYPTION_KEY must be base64-encoded and 256-bit');
  }

  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey, encoding), Buffer.from(iv, encoding));
  decipher.setAuthTag(Buffer.from(authTag, encoding));
  let str = decipher.update(enc, encoding, 'utf8');
  str += decipher.final('utf8');
  return str;
}

const pbkdf2 = util.promisify(crypto.pbkdf2);

export const hashApiKey = async (apiKey: string): Promise<string | null> => {
  if (!encryptionKey) {
    return null;
  }

  const buffer = await pbkdf2(apiKey, encryptionKey, 310000, 32, 'sha256');
  return buffer.toString('base64');
};

export const encryptApiKey = (apiKey: ApiKey): ApiKey => {
  if (!encryptionKey) {
    return apiKey;
  }

  const [encryptedKey, keyIv, keyTag] = encrypt(apiKey.key);
  const encryptedApiKey: ApiKey = {
    ...apiKey,
    key: encryptedKey,
    key_iv: keyIv,
    key_tag: keyTag
  };

  return encryptedApiKey;
};

export const decryptApiKey = (apiKey: ApiKey): ApiKey => {
  if (!apiKey.key || !apiKey.key_iv || !apiKey.key_tag) {
    return apiKey;
  }

  const decryptedKey = decrypt(apiKey.key, apiKey.key_iv, apiKey.key_tag);
  const decryptedApiKey: ApiKey = {
    ...apiKey,
    key: decryptedKey
  };

  return decryptedApiKey;
};
