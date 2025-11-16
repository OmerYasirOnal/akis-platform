import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { env } from '../../lib/env.js';

const secret = new TextEncoder().encode(env.AUTH_JWT_SECRET);

export async function sign(payload: JWTPayload, exp = '7d') {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(exp)
    .setIssuedAt()
    .sign(secret);
}

export async function verify<T extends JWTPayload = JWTPayload>(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as T;
}
