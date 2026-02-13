import { and, eq } from 'drizzle-orm';

import { db } from '../../db/client.js';
import { jobPosts, jobSources } from '../../db/schema.js';
import type { IngestPayload } from './types.js';

function normalizeSkillList(values: string[] | undefined): string[] {
  return (values ?? [])
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

function toKeywords(input: { title: string; description: string; provided?: string[] }): string[] {
  if (input.provided && input.provided.length > 0) {
    return normalizeSkillList(input.provided);
  }

  const combined = `${input.title} ${input.description}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);

  return [...new Set(combined)].slice(0, 20);
}

async function ensureManualSource(sourceName: string): Promise<{ id: string }> {
  const existing = await db
    .select({ id: jobSources.id })
    .from(jobSources)
    .where(and(eq(jobSources.name, sourceName), eq(jobSources.type, 'manual')))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [created] = await db
    .insert(jobSources)
    .values({
      name: sourceName,
      type: 'manual',
      metadata: {
        notes: 'MVP manual ingestion source',
      },
    })
    .returning({ id: jobSources.id });

  return created;
}

export async function ingestJobs(payload: IngestPayload): Promise<{ ingested: number; sourceId: string }> {
  const source = await ensureManualSource(payload.source || 'manual');

  let ingested = 0;

  for (const job of payload.jobs) {
    const row = {
      sourceId: source.id,
      externalId: job.externalId ?? null,
      title: job.title.trim(),
      description: job.description.trim(),
      requiredSkills: normalizeSkillList(job.requiredSkills),
      keywords: toKeywords({
        title: job.title,
        description: job.description,
        provided: job.keywords,
      }),
      seniority: job.seniority ?? null,
      language: job.language ?? null,
      location: job.location ?? null,
      remoteAllowed: job.remoteAllowed ?? true,
      budgetMin: typeof job.budgetMin === 'number' ? job.budgetMin.toFixed(2) : null,
      budgetMax: typeof job.budgetMax === 'number' ? job.budgetMax.toFixed(2) : null,
      currency: job.currency ?? 'USD',
      rawPayload: job.rawPayload ?? null,
      updatedAt: new Date(),
      ingestedAt: new Date(),
    };

    if (job.externalId) {
      const existing = await db
        .select({ id: jobPosts.id })
        .from(jobPosts)
        .where(and(eq(jobPosts.sourceId, source.id), eq(jobPosts.externalId, job.externalId)))
        .limit(1);

      if (existing.length > 0) {
        await db.update(jobPosts).set(row).where(eq(jobPosts.id, existing[0].id));
        ingested += 1;
        continue;
      }
    }

    await db.insert(jobPosts).values(row);
    ingested += 1;
  }

  return { ingested, sourceId: source.id };
}
