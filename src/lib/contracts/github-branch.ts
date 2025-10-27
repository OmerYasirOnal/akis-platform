/**
 * GitHub Branch API Contract
 * Shared schema between frontend and backend
 */

import { z } from 'zod';

/**
 * Request Schema for POST /api/github/branch
 */
export const CreateBranchRequestSchema = z.object({
  owner: z.string().min(1, 'Owner is required'),
  repo: z.string().min(1, 'Repository name is required'),
  branchName: z.string().min(1, 'Branch name is required'),
  baseBranch: z.string().optional(), // Optional: uses default branch if not provided
  accessToken: z.string().optional(), // Optional: uses GitHub App token if not provided
});

export type CreateBranchRequest = z.infer<typeof CreateBranchRequestSchema>;

/**
 * Response Schema for POST /api/github/branch
 */
export const CreateBranchResponseSchema = z.object({
  success: z.boolean(),
  action: z.enum(['created', 'exists', 'error']).optional(),
  sha: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
});

export type CreateBranchResponse = z.infer<typeof CreateBranchResponseSchema>;

/**
 * Error response for validation failures
 */
export interface ValidationErrorResponse {
  success: false;
  error: string;
  issues?: Array<{
    path: string[];
    message: string;
  }>;
}

