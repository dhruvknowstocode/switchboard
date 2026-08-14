import { createHash, randomBytes } from 'crypto';

const KEY_PREFIX = 'sb_live_';

export function generateApiKeySecret(): { plaintext: string; prefix: string; hash: string } {
  const secret = randomBytes(24).toString('hex');
  const plaintext = `${KEY_PREFIX}${secret}`;
  const prefix = plaintext.slice(0, 16);
  return {
    plaintext,
    prefix,
    hash: hashApiKey(plaintext),
  };
}

export function hashApiKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}
