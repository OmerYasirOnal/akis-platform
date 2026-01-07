import { and, eq } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { userAiKeys, users, type UserAiKey } from '../../db/schema.js';
import { decryptSecret, encryptSecret } from '../../utils/crypto.js';

export type AIKeyProvider = 'openai' | 'openrouter';

export type AIKeyStatus = {
  provider: AIKeyProvider;
  configured: boolean;
  last4: string | null;
  updatedAt: string | null;
};

export type MultiProviderStatus = {
  activeProvider: AIKeyProvider;
  providers: {
    openai: Omit<AIKeyStatus, 'provider'>;
    openrouter: Omit<AIKeyStatus, 'provider'>;
  };
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

/**
 * Get multi-provider status including active provider for a user
 */
export async function getMultiProviderStatus(userId: string): Promise<MultiProviderStatus> {
  // Get user's active provider
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { activeAiProvider: true },
  });

  const activeProvider: AIKeyProvider = (user?.activeAiProvider as AIKeyProvider) || 'openrouter';

  // Get status for both providers
  const [openaiStatus, openrouterStatus] = await Promise.all([
    getUserAiKeyStatus(userId, 'openai'),
    getUserAiKeyStatus(userId, 'openrouter'),
  ]);

  return {
    activeProvider,
    providers: {
      openai: {
        configured: openaiStatus.configured,
        last4: openaiStatus.last4,
        updatedAt: openaiStatus.updatedAt,
      },
      openrouter: {
        configured: openrouterStatus.configured,
        last4: openrouterStatus.last4,
        updatedAt: openrouterStatus.updatedAt,
      },
    },
  };
}

/**
 * Set user's active AI provider
 */
export async function setUserActiveProvider(
  userId: string,
  provider: AIKeyProvider
): Promise<AIKeyProvider> {
  await db
    .update(users)
    .set({ activeAiProvider: provider, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return provider;
}

/**
 * Get user's active AI provider
 */
export async function getUserActiveProvider(userId: string): Promise<AIKeyProvider> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { activeAiProvider: true },
  });

  return (user?.activeAiProvider as AIKeyProvider) || 'openrouter';
}
