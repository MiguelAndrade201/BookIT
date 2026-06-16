export const ADMIN_SESSION_COOKIE = 'directbnb_admin_session';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

function bytesToHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return atob(padded);
}

async function sha256(value: string) {
  return bytesToHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function signature(payload: string) {
  const secret = process.env.AUTH_SECRET ?? process.env.ADMIN_PASSWORD ?? 'change-this-password';
  return sha256(`${payload}.${secret}`);
}

export async function hashPassword(password: string) {
  const secret = process.env.AUTH_SECRET ?? 'directbnb-local-secret';
  return sha256(`${password}.${secret}`);
}

export async function verifyPassword(password: string, hash: string) {
  return await hashPassword(password) === hash;
}

export async function createSessionToken(user: SessionUser) {
  const payload = base64UrlEncode(JSON.stringify(user));
  return `${payload}.${await signature(payload)}`;
}

export async function parseSessionToken(token?: string): Promise<SessionUser | null> {
  if (!token) return null;
  const [payload, signed] = token.split('.');
  if (!payload || !signed || signed !== await signature(payload)) return null;

  try {
    return JSON.parse(base64UrlDecode(payload)) as SessionUser;
  } catch {
    return null;
  }
}

export async function isValidAdminSession(token?: string) {
  const user = await parseSessionToken(token);
  return Boolean(user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role));
}

export async function legacyAdminSessionToken() {
  const username = process.env.ADMIN_USERNAME ?? process.env.ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.ADMIN_PASSWORD ?? 'change-this-password';
  const secret = process.env.AUTH_SECRET ?? password;
  return sha256(`${username}:${password}:${secret}`);
}
