import { ApprovalGateService } from '../../core/approval/ApprovalGateService.js';

export async function approveCommand(opts: {
  list?: boolean;
  approve?: string;
  reject?: string;
  expire?: boolean;
}): Promise<void> {
  const gate = new ApprovalGateService();

  if (opts.approve) {
    const success = gate.approve(opts.approve, 'human', 'Approved via CLI');
    if (success) {
      console.log(`Approved: ${opts.approve}`);
    } else {
      console.log(`Failed to approve ${opts.approve} — may not be pending`);
    }
    return;
  }

  if (opts.reject) {
    const success = gate.reject(opts.reject, 'human', 'Rejected via CLI');
    if (success) {
      console.log(`Rejected: ${opts.reject}`);
    } else {
      console.log(`Failed to reject ${opts.reject} — may not be pending`);
    }
    return;
  }

  if (opts.expire) {
    const expired = gate.expireStale(24);
    console.log(`Expired ${expired} stale approvals (older than 24h).`);
    return;
  }

  // Default: list pending
  const pending = gate.getPending();

  if (pending.length === 0) {
    console.log('No pending approvals.');
    return;
  }

  console.log(`Pending approvals (${pending.length}):`);
  console.log('');

  for (const item of pending) {
    console.log(`ID: ${item.id}`);
    console.log(`  Action: ${item.actionType}`);
    console.log(`  Platform: ${item.platform ?? 'N/A'}`);
    console.log(`  Created: ${item.createdAt}`);
    if (item.jobId) console.log(`  Job ID: ${item.jobId}`);

    const payload = item.payload;
    if (payload.jobTitle) console.log(`  Job: ${payload.jobTitle}`);
    if (payload.proposal) {
      const preview = String(payload.proposal).slice(0, 100);
      console.log(`  Proposal: ${preview}...`);
    }

    console.log('');
  }

  console.log('Commands:');
  console.log('  career approve --approve <id>  — Approve');
  console.log('  career approve --reject <id>   — Reject');
  console.log('  career approve --expire        — Expire stale (>24h)');
}
