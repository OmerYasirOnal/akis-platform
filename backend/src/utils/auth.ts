/**
 * Auth utilities - Extract user from JWT cookie
 * S0.4.6: Reusable auth helper for protected routes
 */
import { FastifyRequest } from 'fastify';
import { verify } from '../services/auth/jwt.js';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getEnv } from '../config/env.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
}

/**
 * Extract authenticated user from request cookie
 * @param request Fastify request
 * @returns User if authenticated, throws otherwise
 * @throws Error('UNAUTHORIZED') if no token or invalid user
 */
export async function requireAuth(request: FastifyRequest): Promise<AuthenticatedUser> {
  const env = getEnv();
  const token = request.cookies?.[env.AUTH_COOKIE_NAME];
  
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }

  try {
    const payload = await verify<{ sub: string; email: string; name: string }>(token);
    
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
    });

    if (!user || user.status !== 'active') {
      throw new Error('UNAUTHORIZED');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  } catch {
    throw new Error('UNAUTHORIZED');
  }
}

