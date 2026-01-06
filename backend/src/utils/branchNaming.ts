/**
 * Branch Naming Utilities for Scribe Agent
 * 
 * Provides deterministic, unique branch name generation following
 * the format: scribe/docs-{YYYYMMDD-HHMMSS}
 * 
 * Example: scribe/docs-20250106-143022
 */

/**
 * Generate auto branch name for Scribe
 * Format: scribe/docs-{YYYYMMDD-HHMMSS}
 * 
 * @example
 * generateScribeBranchName() // "scribe/docs-20250106-143022"
 */
export function generateScribeBranchName(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  
  return `scribe/docs-${yyyy}${mm}${dd}-${HH}${MM}${SS}`;
}

/**
 * Generate branch name with custom prefix
 * 
 * @param prefix - Branch prefix (default: 'scribe/docs')
 * @example
 * generateBranchNameWithPrefix('feature/update') // "feature/update-20250106-143022"
 */
export function generateBranchNameWithPrefix(prefix: string = 'scribe/docs'): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const HH = String(now.getHours()).padStart(2, '0');
  const MM = String(now.getMinutes()).padStart(2, '0');
  const SS = String(now.getSeconds()).padStart(2, '0');
  
  return `${prefix}-${yyyy}${mm}${dd}-${HH}${MM}${SS}`;
}

/**
 * Validate branch name format
 * Returns true if the branch name matches our expected pattern
 * 
 * @param branchName - Branch name to validate
 */
export function isValidScribeBranchName(branchName: string): boolean {
  return /^scribe\/docs-\d{8}-\d{6}$/.test(branchName);
}


