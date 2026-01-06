import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { userAiKeys, type UserAiKey } from '../../db/schema.js';
import { decryptSecret, encryptSecret } from '../../utils/crypto.js';

export type AIKeyProvider = 'openai';

export type AIKeyStatus = {
  provider: AIKeyProvider;
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
};

export function normalizeApiKey(key: string): string {
  return key.trim();
}

function buildScope(userId: string, provider: AIKeyProvider): string {
  return `${userId}:${provider}`;
}

export async function getUserAiKeyStatus(
  userId: string,
  provider: AIKeyProvider
): Promise<AIKeyStatus> {
  const record = await db.query.userAiKeys.findFirst({
    where: and(eq(userAiKeys.userId, userId), eq(userAiKeys.provider, provider)),
  });

  return {
    provider,
    configured: Boolean(record),
    last4: record?.last4 ?? null,
    updatedAt: record?.updatedAt ? record.updatedAt.toISOString() : null,
  };
}

export async function upsertUserAiKey(
  userId: string,
  provider: AIKeyProvider,
  apiKey: string
): Promise<AIKeyStatus> {
  const normalized = normalizeApiKey(apiKey);
  const last4 = normalized.slice(-4);
  const encrypted = encryptSecret(normalized, buildScope(userId, provider));
  const now = new Date();

  await db
    .insert(userAiKeys)
    .values({
      userId,
      provider,
      encryptedKey: encrypted.cipherText,
      keyIv: encrypted.iv,
      keyTag: encrypted.authTag,
      keyVersion: encrypted.keyVersion,
      last4,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [userAiKeys.userId, userAiKeys.provider],
      set: {
        encryptedKey: encrypted.cipherText,
        keyIv: encrypted.iv,
        keyTag: encrypted.authTag,
        keyVersion: encrypted.keyVersion,
        last4,
        updatedAt: now,
      },
    });

  return {
    provider,
    configured: true,
    last4,
    updatedAt: now.toISOString(),
  };
}

export async function deleteUserAiKey(
  userId: string,
  provider: AIKeyProvider
): Promise<void> {
  await db
    .delete(userAiKeys)
    .where(and(eq(userAiKeys.userId, userId), eq(userAiKeys.provider, provider)));
}

export async function getDecryptedUserAiKey(
  userId: string,
  provider: AIKeyProvider
): Promise<{ key: string; record: UserAiKey } | null> {
  const record = await db.query.userAiKeys.findFirst({
    where: and(eq(userAiKeys.userId, userId), eq(userAiKeys.provider, provider)),
  });

  if (!record) {
    return null;
  }

  const decrypted = decryptSecret(
    {
      cipherText: record.encryptedKey,
      iv: record.keyIv,
      authTag: record.keyTag,
      keyVersion: record.keyVersion,
    },
    buildScope(userId, provider)
  );

  return { key: decrypted, record };
}
