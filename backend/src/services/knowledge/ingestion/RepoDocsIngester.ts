import { db } from '../../../db/client.js';
import { knowledgeDocuments, knowledgeChunks } from '../../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHash } from 'crypto';

const CHUNK_SIZE = 1500;
const CHUNK_OVERLAP = 200;

export interface IngestionOptions {
  workspaceId?: string;
  agentType?: string;
  commitSha?: string;
}

export interface IngestionResult {
  documentId: string;
  title: string;
  chunksCreated: number;
  isNew: boolean;
}

export class RepoDocsIngester {
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private chunkContent(content: string): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < content.length) {
      const end = Math.min(start + CHUNK_SIZE, content.length);
      let chunkEnd = end;

      if (end < content.length) {
        const lastNewline = content.lastIndexOf('\n', end);
        const lastPeriod = content.lastIndexOf('. ', end);
        const breakPoint = Math.max(lastNewline, lastPeriod);
        
        if (breakPoint > start + CHUNK_SIZE / 2) {
          chunkEnd = breakPoint + 1;
        }
      }

      chunks.push(content.slice(start, chunkEnd).trim());
      start = chunkEnd - CHUNK_OVERLAP;
      if (start < 0) start = 0;
    }

    return chunks.filter(c => c.length > 0);
  }

  private getContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  async ingestFile(
    filePath: string,
    options: IngestionOptions = {}
  ): Promise<IngestionResult | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      const title = fileName.replace(/\.(md|txt|ts|js)$/, '');
      const contentHash = this.getContentHash(content);

      const existingDoc = await db
        .select()
        .from(knowledgeDocuments)
        .where(
          and(
            eq(knowledgeDocuments.sourcePath, filePath),
            eq(knowledgeDocuments.status, 'approved')
          )
        )
        .limit(1);

      if (existingDoc.length > 0) {
        const existingMeta = existingDoc[0].metadata as Record<string, unknown> | null;
        if (existingMeta?.contentHash === contentHash) {
          return {
            documentId: existingDoc[0].id,
            title: existingDoc[0].title,
            chunksCreated: 0,
            isNew: false,
          };
        }
      }

      const [newDoc] = await db
        .insert(knowledgeDocuments)
        .values({
          title,
          content,
          docType: 'repo_doc',
          sourcePath: filePath,
          commitSha: options.commitSha,
          agentType: options.agentType,
          workspaceId: options.workspaceId,
          status: 'proposed',
          metadata: { contentHash },
        })
        .returning();

      const chunks = this.chunkContent(content);
      const chunkInserts = chunks.map((chunkContent, index) => ({
        documentId: newDoc.id,
        chunkIndex: index,
        content: chunkContent,
        tokenCount: this.estimateTokens(chunkContent),
      }));

      if (chunkInserts.length > 0) {
        await db.insert(knowledgeChunks).values(chunkInserts);
      }

      return {
        documentId: newDoc.id,
        title: newDoc.title,
        chunksCreated: chunks.length,
        isNew: true,
      };
    } catch {
      return null;
    }
  }

  async ingestDirectory(
    dirPath: string,
    options: IngestionOptions = {},
    extensions = ['.md', '.txt']
  ): Promise<IngestionResult[]> {
    const results: IngestionResult[] = [];

    async function walkDir(currentPath: string): Promise<string[]> {
      const files: string[] = [];
      try {
        const entries = await fs.readdir(currentPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(currentPath, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            files.push(...await walkDir(fullPath));
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Ignore directories that can't be read
      }
      return files;
    }

    const files = await walkDir(dirPath);

    for (const file of files) {
      const result = await this.ingestFile(file, options);
      if (result) {
        results.push(result);
      }
    }

    return results;
  }

  async approveDocument(documentId: string): Promise<boolean> {
    const result = await db
      .update(knowledgeDocuments)
      .set({ 
        status: 'approved',
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, documentId))
      .returning();

    return result.length > 0;
  }

  async deprecateDocument(documentId: string): Promise<boolean> {
    const result = await db
      .update(knowledgeDocuments)
      .set({ 
        status: 'deprecated',
        updatedAt: new Date(),
      })
      .where(eq(knowledgeDocuments.id, documentId))
      .returning();

    return result.length > 0;
  }
}

export const repoDocsIngester = new RepoDocsIngester();
