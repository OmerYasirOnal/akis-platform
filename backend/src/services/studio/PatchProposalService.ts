/**
 * PatchProposalService — manages file patches proposed by AI agents in Studio.
 *
 * Patches are stored as structured diffs that can be reviewed, approved, or rejected.
 * No direct file system writes — patches must be explicitly applied.
 */

import { z } from 'zod';

export const patchStatusEnum = z.enum(['proposed', 'approved', 'applied', 'rejected']);
export type PatchStatus = z.infer<typeof patchStatusEnum>;

export const filePatchSchema = z.object({
  filePath: z.string().min(1).max(512),
  operation: z.enum(['create', 'modify', 'delete']),
  content: z.string().max(100_000).optional(),
  diff: z.string().max(100_000).optional(),
});

export type FilePatch = z.infer<typeof filePatchSchema>;

export const patchProposalSchema = z.object({
  id: z.string().uuid().optional(),
  sessionId: z.string().uuid(),
  title: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  patches: z.array(filePatchSchema).min(1).max(50),
  status: patchStatusEnum.default('proposed'),
});

export type PatchProposal = z.infer<typeof patchProposalSchema>;

/**
 * Validate a patch proposal against security rules.
 * Returns list of validation errors (empty = valid).
 */
export function validatePatchProposal(proposal: PatchProposal): string[] {
  const errors: string[] = [];

  const FORBIDDEN_PATHS = ['.env', '.env.local', '.env.staging', '.env.production', 'id_rsa', 'credentials.json'];
  const FORBIDDEN_EXTENSIONS = ['.pem', '.key', '.p12', '.pfx'];

  for (const patch of proposal.patches) {
    const lower = patch.filePath.toLowerCase();

    // Path traversal check
    if (patch.filePath.includes('..')) {
      errors.push(`Path traversal detected: ${patch.filePath}`);
    }

    // Absolute path check
    if (patch.filePath.startsWith('/') || patch.filePath.startsWith('\\')) {
      errors.push(`Absolute paths not allowed: ${patch.filePath}`);
    }

    // Forbidden file check
    for (const forbidden of FORBIDDEN_PATHS) {
      if (lower.endsWith(forbidden) || lower === forbidden) {
        errors.push(`Forbidden file: ${patch.filePath}`);
      }
    }

    // Forbidden extension check
    for (const ext of FORBIDDEN_EXTENSIONS) {
      if (lower.endsWith(ext)) {
        errors.push(`Forbidden extension: ${patch.filePath}`);
      }
    }

    // Operation-content consistency
    if (patch.operation === 'create' && !patch.content) {
      errors.push(`Create operation requires content: ${patch.filePath}`);
    }
    if (patch.operation === 'delete' && (patch.content || patch.diff)) {
      errors.push(`Delete operation should not include content: ${patch.filePath}`);
    }
  }

  return errors;
}

/**
 * Compute summary statistics for a patch proposal.
 */
export function computePatchSummary(proposal: PatchProposal) {
  const created = proposal.patches.filter((p) => p.operation === 'create').length;
  const modified = proposal.patches.filter((p) => p.operation === 'modify').length;
  const deleted = proposal.patches.filter((p) => p.operation === 'delete').length;
  const totalFiles = proposal.patches.length;

  return { totalFiles, created, modified, deleted, status: proposal.status };
}
