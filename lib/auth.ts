import { SignJWT, jwtVerify } from 'jose';

export const COOKIE_NAME = 'session';
export const JWT_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const JWT_ALG = 'HS256';

export interface JwtPayload {
  userId: string;
  email: string;
  orgId: string;
  role: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is not set');
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(`${JWT_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}
