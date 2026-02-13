import { loadUserProfile } from '../../config/user-profile.js';
import { JobFeed } from '../../core/job-discovery/JobFeed.js';
import { ProposalGenerator } from '../../core/materials/ProposalGenerator.js';
import { ApprovalGateService } from '../../core/approval/ApprovalGateService.js';
import { DailyLimitsEnforcer } from '../../core/limits/DailyLimitsEnforcer.js';

export async function applyCommand(opts: {
  jobId: string;
  autoApprove?: boolean;
}): Promise<void> {
  const profile = loadUserProfile();
  const feed = new JobFeed();
  const proposalGen = new ProposalGenerator(profile);
  const approvalGate = new ApprovalGateService();
  const limiter = new DailyLimitsEnforcer();

  if (!limiter.canSubmit()) {
    console.log('Daily submission limit reached. Try again tomorrow.');
    return;
  }

  const job = feed.getJobById(opts.jobId);
  if (!job) {
    console.log(`Job not found: ${opts.jobId}`);
    return;
  }

  console.log(`Generating proposal for: ${job.title} (${job.platform})`);
  console.log('');

  try {
    const proposal = await proposalGen.generateProposal(job);

    console.log('Generated proposal:');
    console.log('─'.repeat(50));
    console.log(proposal.coverLetter);
    console.log('─'.repeat(50));
    console.log('');

    if (proposal.bidAmount) {
      console.log(`Bid: ${proposal.bidAmount} ${proposal.bidCurrency}`);
    }
    console.log(`Language: ${proposal.language}`);
    console.log('');

    if (opts.autoApprove) {
      console.log('Auto-approve enabled. Submitting...');
      // In production, this would call the platform adapter to submit
      feed.updateJobState(job.id, 'submitted');
      limiter.incrementSubmit();
      console.log('Submitted (mock — platform submission not connected yet).');
    } else {
      const approval = approvalGate.requestApproval(
        'submit_application',
        {
          jobTitle: job.title,
          platform: job.platform,
          proposal: proposal.coverLetter,
          bidAmount: proposal.bidAmount,
        },
        job.id,
        job.platform,
      );

      feed.updateJobState(job.id, 'awaiting_approval');

      console.log('Proposal saved. Awaiting approval.');
      console.log(`Approval ID: ${approval.id}`);
      console.log('');
      console.log('To approve: career approve --approve ' + approval.id);
      console.log('To reject:  career approve --reject ' + approval.id);
      console.log('Or approve via Telegram bot.');
    }
  } catch (error) {
    console.error('Error generating proposal:', error instanceof Error ? error.message : String(error));
    console.log('');
    console.log('Make sure OPENAI_API_KEY is set in .env');
  }
}
