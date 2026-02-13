import TelegramBotAPI from 'node-telegram-bot-api';
import { ApprovalGateService } from '../core/approval/ApprovalGateService.js';
import type { ScoredJob } from '../core/scoring/types.js';
import { DailyLimitsEnforcer } from '../core/limits/DailyLimitsEnforcer.js';

export class TelegramNotifier {
  private bot: TelegramBotAPI | null = null;
  private chatId: string;
  private approvalGate: ApprovalGateService;
  private limiter: DailyLimitsEnforcer;

  constructor() {
    this.chatId = process.env.TELEGRAM_CHAT_ID ?? '';
    this.approvalGate = new ApprovalGateService();
    this.limiter = new DailyLimitsEnforcer();
  }

  async initialize(): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN not set — notifications disabled');
      return;
    }

    if (!this.chatId) {
      console.warn('TELEGRAM_CHAT_ID not set — notifications disabled');
      return;
    }

    this.bot = new TelegramBotAPI(token, { polling: true });

    this.bot.onText(/\/status/, async () => {
      await this.sendStatus();
    });

    this.bot.onText(/\/pending/, async () => {
      await this.sendPendingApprovals();
    });

    this.bot.onText(/\/approve (.+)/, async (_msg, match) => {
      const approvalId = match?.[1]?.trim();
      if (approvalId) {
        const success = this.approvalGate.approve(approvalId, 'human', 'Approved via Telegram');
        await this.send(success ? `Approved: ${approvalId}` : `Failed to approve: ${approvalId}`);
      }
    });

    this.bot.onText(/\/reject (.+)/, async (_msg, match) => {
      const approvalId = match?.[1]?.trim();
      if (approvalId) {
        const success = this.approvalGate.reject(approvalId, 'human', 'Rejected via Telegram');
        await this.send(success ? `Rejected: ${approvalId}` : `Failed to reject: ${approvalId}`);
      }
    });

    this.bot.on('callback_query', async (query) => {
      const data = query.data;
      if (!data) return;

      if (data.startsWith('approve:')) {
        const id = data.slice(8);
        const success = this.approvalGate.approve(id, 'human', 'Approved via inline button');
        await this.bot?.answerCallbackQuery(query.id, {
          text: success ? 'Approved!' : 'Failed to approve',
        });
        if (success) {
          await this.bot?.editMessageReplyMarkup(
            { inline_keyboard: [[{ text: 'Approved', callback_data: 'noop' }]] },
            { chat_id: query.message?.chat.id, message_id: query.message?.message_id },
          );
        }
      } else if (data.startsWith('reject:')) {
        const id = data.slice(7);
        const success = this.approvalGate.reject(id, 'human', 'Rejected via inline button');
        await this.bot?.answerCallbackQuery(query.id, {
          text: success ? 'Rejected!' : 'Failed to reject',
        });
        if (success) {
          await this.bot?.editMessageReplyMarkup(
            { inline_keyboard: [[{ text: 'Rejected', callback_data: 'noop' }]] },
            { chat_id: query.message?.chat.id, message_id: query.message?.message_id },
          );
        }
      }
    });
  }

  async notifyNewMatch(job: ScoredJob, proposalPreview?: string): Promise<void> {
    const approval = this.approvalGate.requestApproval(
      'submit_application',
      { jobTitle: job.title, platform: job.platform, score: job.score, proposal: proposalPreview },
      job.id,
      job.platform,
    );

    const message = `
*New Job Match* (Score: ${job.score}/100)

*${escapeMarkdown(job.title)}*
${escapeMarkdown(job.companyName)} | ${job.platform}
${job.workModel} | ${job.techStack.slice(0, 5).join(', ')}

${proposalPreview ? `_Proposal preview:_ ${escapeMarkdown(proposalPreview.slice(0, 200))}...` : ''}

Approval ID: \`${approval.id}\`
    `.trim();

    await this.sendWithButtons(message, [
      [
        { text: 'Approve', callback_data: `approve:${approval.id}` },
        { text: 'Reject', callback_data: `reject:${approval.id}` },
      ],
    ]);
  }

  async sendStatus(): Promise<void> {
    const remaining = this.limiter.remainingToday();
    const counters = this.limiter.getCounters();
    const pending = this.approvalGate.getPending();

    const message = `
*Daily Status*

Discovered: ${counters.discovered} (${remaining.discover} remaining)
Shortlisted: ${counters.shortlisted} (${remaining.shortlist} remaining)
Submitted: ${counters.submitted} (${remaining.submit} remaining)
Outreach: ${counters.outreach} (${remaining.outreach} remaining)

Pending approvals: ${pending.length}
    `.trim();

    await this.send(message);
  }

  async sendPendingApprovals(): Promise<void> {
    const pending = this.approvalGate.getPending();

    if (pending.length === 0) {
      await this.send('No pending approvals.');
      return;
    }

    for (const item of pending.slice(0, 5)) {
      const message = `
*Pending:* ${item.actionType}
Platform: ${item.platform ?? 'N/A'}
ID: \`${item.id}\`
Created: ${item.createdAt}
      `.trim();

      await this.sendWithButtons(message, [
        [
          { text: 'Approve', callback_data: `approve:${item.id}` },
          { text: 'Reject', callback_data: `reject:${item.id}` },
        ],
      ]);
    }
  }

  async send(text: string): Promise<void> {
    if (!this.bot || !this.chatId) return;
    await this.bot.sendMessage(this.chatId, text, { parse_mode: 'Markdown' });
  }

  private async sendWithButtons(
    text: string,
    buttons: Array<Array<{ text: string; callback_data: string }>>,
  ): Promise<void> {
    if (!this.bot || !this.chatId) return;
    await this.bot.sendMessage(this.chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: buttons },
    });
  }

  async teardown(): Promise<void> {
    if (this.bot) {
      await this.bot.stopPolling();
      this.bot = null;
    }
  }
}

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, '\\$&');
}
