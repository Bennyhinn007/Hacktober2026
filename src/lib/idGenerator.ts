// Cryptographically secure non-sequential registration ID generator
// Format: HT26-XXXXXX (e.g. HT26-9E4K27, HT26-004271 style random numeric or alphanumeric)
import crypto from 'node:crypto';

const CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude ambiguous chars 0, 1, I, O

export function generateRegistrationId(): string {
  // Generate 6 character non-sequential alphanumeric string
  const bytes = crypto.randomBytes(6);
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return `HT26-${result}`;
}

export function generateSafeToken(registrationId: string): string {
  const secret = process.env.AUTH_SECRET || 'hacktober2026-safe-secret-key';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`hacktober:reg:${registrationId}`);
  const signature = hmac.digest('hex').substring(0, 16);
  return `${registrationId}-${signature}`;
}

export function verifySafeToken(token: string): { isValid: boolean; registrationId: string | null } {
  if (!token || !token.includes('-')) {
    return { isValid: false, registrationId: null };
  }
  const parts = token.split('-');
  if (parts.length < 3) {
    return { isValid: false, registrationId: null };
  }
  const registrationId = `${parts[0]}-${parts[1]}`;
  const signature = parts.slice(2).join('-');
  const expectedToken = generateSafeToken(registrationId);
  const expectedSignature = expectedToken.split('-').slice(2).join('-');

  if (signature === expectedSignature) {
    return { isValid: true, registrationId };
  }
  return { isValid: false, registrationId: null };
}
