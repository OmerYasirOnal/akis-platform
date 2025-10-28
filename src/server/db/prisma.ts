/**
 * Prisma Client Singleton
 * 
 * Provides a singleton instance of PrismaClient for database operations.
 * Part of Phase 1: Data Layer & Sessions (Scaffold)
 * Part of Phase 2: Token Encryption Middleware (Gate-B requirement)
 * 
 * @module server/db/prisma
 */

import { PrismaClient } from '@prisma/client';
import { encryptToken, decryptToken, needsKeyRotation, rotateTokenEncryption } from '@/server/security/encryption';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Prisma Middleware: Encrypt/Decrypt Session Tokens (AES-256-GCM)
 * 
 * Automatically encrypts tokens before write and decrypts after read.
 * Supports key rotation (SESSION_SECRET_OLD fallback).
 */
prisma.$use(async (params, next) => {
  // Encrypt before write
  if (params.model === 'Session' && ['create', 'update', 'upsert'].includes(params.action)) {
    if (params.action === 'upsert') {
      // Handle upsert.create and upsert.update
      if (params.args.create?.accessToken) {
        params.args.create.accessToken = encryptToken(params.args.create.accessToken);
      }
      if (params.args.create?.refreshToken) {
        params.args.create.refreshToken = encryptToken(params.args.create.refreshToken);
      }
      if (params.args.update?.accessToken) {
        params.args.update.accessToken = encryptToken(params.args.update.accessToken);
      }
      if (params.args.update?.refreshToken) {
        params.args.update.refreshToken = encryptToken(params.args.update.refreshToken);
      }
    } else {
      // Handle create and update
      if (params.args.data?.accessToken) {
        params.args.data.accessToken = encryptToken(params.args.data.accessToken);
      }
      if (params.args.data?.refreshToken) {
        params.args.data.refreshToken = encryptToken(params.args.data.refreshToken);
      }
    }
  }
  
  const result = await next(params);
  
  // Decrypt after read
  if (params.model === 'Session' && ['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
    const sessions = Array.isArray(result) ? result : result ? [result] : [];
    
    for (const session of sessions) {
      if (session?.accessToken) {
        try {
          // Check if needs key rotation
          if (needsKeyRotation(session.accessToken)) {
            // Decrypt and re-encrypt with new key (lazy rotation)
            session.accessToken = decryptToken(session.accessToken);
            // Note: Re-encryption happens on next update
          } else {
            session.accessToken = decryptToken(session.accessToken);
          }
        } catch (error) {
          console.error('[Prisma] Failed to decrypt accessToken:', error);
          session.accessToken = null; // Fail-safe: null out corrupted token
        }
      }
      
      if (session?.refreshToken) {
        try {
          if (needsKeyRotation(session.refreshToken)) {
            session.refreshToken = decryptToken(session.refreshToken);
          } else {
            session.refreshToken = decryptToken(session.refreshToken);
          }
        } catch (error) {
          console.error('[Prisma] Failed to decrypt refreshToken:', error);
          session.refreshToken = null; // Fail-safe: null out corrupted token
        }
      }
    }
  }
  
  return result;
});

/**
 * Graceful shutdown handler
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// Handle process termination
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectPrisma();
  });
}

