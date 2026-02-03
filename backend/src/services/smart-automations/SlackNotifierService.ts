/**
 * Slack Notifier Service
 * Sends draft notifications to Slack channels using Block Kit
 */

import type { SlackNotificationPayload, SlackMessageResponse } from './types.js';
import { getEnv } from '../../config/env.js';

/**
 * Build Slack Block Kit message for draft notification
 */
function buildSlackBlocks(payload: SlackNotificationPayload) {
  const { automationName, draft, summary, sources, hashtags, runId, automationId } = payload;

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📝 ${automationName} - Yeni Taslak`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Özet:* ${summary || 'İçerik hazır'}`,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: draft.length > 2900 ? draft.substring(0, 2900) + '...' : draft,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Hashtag'ler:*\n${hashtags.join(' ')}`,
        },
        {
          type: 'mrkdwn',
          text: `*Kaynak Sayısı:* ${sources.length}`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Kaynaklar:*\n${sources.slice(0, 5).map((s, i) => `${i + 1}. <${s}|Kaynak ${i + 1}>`).join('\n')}${sources.length > 5 ? `\n_...ve ${sources.length - 5} daha_` : ''}`,
      },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '📋 Kopyala ve Paylaş',
            emoji: true,
          },
          url: `https://www.linkedin.com/feed/?shareActive=true`,
          action_id: 'open_linkedin',
        },
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '👁️ Detay Görüntüle',
            emoji: true,
          },
          url: `${getEnv().FRONTEND_URL || 'http://localhost:5173'}/agents/smart-automations/${automationId}?runId=${runId}`,
          action_id: 'view_detail',
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Run ID: \`${runId}\` | Otomasyon: ${automationName}`,
        },
      ],
    },
  ];
}

export class SlackNotifierService {
  private botToken: string | undefined;
  private defaultChannel: string | undefined;
  private logger: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void };

  constructor(
    logger?: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void }
  ) {
    const env = getEnv();
    this.botToken = env.SLACK_BOT_TOKEN;
    this.defaultChannel = env.SLACK_DEFAULT_CHANNEL;
    this.logger = logger || {
      info: (msg, data) => console.log(`[SlackNotifier] ${msg}`, data || ''),
      error: (msg, data) => console.error(`[SlackNotifier] ${msg}`, data || ''),
    };
  }

  /**
   * Check if Slack is configured
   */
  isConfigured(): boolean {
    return !!this.botToken;
  }

  /**
   * Send draft notification to Slack
   * @returns message_ts for tracking
   */
  async sendDraftNotification(
    payload: SlackNotificationPayload,
    channel?: string
  ): Promise<SlackMessageResponse> {
    if (!this.botToken) {
      this.logger.error('Slack bot token not configured');
      return { ok: false, error: 'SLACK_NOT_CONFIGURED' };
    }

    const targetChannel = channel || this.defaultChannel;
    if (!targetChannel) {
      this.logger.error('No Slack channel specified');
      return { ok: false, error: 'NO_CHANNEL_SPECIFIED' };
    }

    try {
      this.logger.info('Sending Slack notification', {
        channel: targetChannel,
        automationName: payload.automationName,
        runId: payload.runId,
      });

      const blocks = buildSlackBlocks(payload);

      const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({
          channel: targetChannel,
          text: `📝 ${payload.automationName} - Yeni LinkedIn taslağı hazır!`,
          blocks,
        }),
      });

      const result = await response.json() as { ok: boolean; ts?: string; error?: string };

      if (!result.ok) {
        this.logger.error('Slack API error', { error: result.error });
        return { ok: false, error: result.error };
      }

      this.logger.info('Slack notification sent', { ts: result.ts });
      return { ok: true, ts: result.ts };
    } catch (error) {
      this.logger.error('Failed to send Slack notification', { error: String(error) });
      return { ok: false, error: String(error) };
    }
  }

  /**
   * Resend a previous notification (for retry)
   */
  async resendNotification(
    payload: SlackNotificationPayload,
    channel?: string
  ): Promise<SlackMessageResponse> {
    // Simply send again - Slack doesn't have a built-in resend
    return this.sendDraftNotification(payload, channel);
  }

  /**
   * Update an existing message (for status updates)
   */
  async updateMessage(
    channel: string,
    messageTs: string,
    payload: SlackNotificationPayload
  ): Promise<SlackMessageResponse> {
    if (!this.botToken) {
      return { ok: false, error: 'SLACK_NOT_CONFIGURED' };
    }

    try {
      const blocks = buildSlackBlocks(payload);

      const response = await fetch('https://slack.com/api/chat.update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({
          channel,
          ts: messageTs,
          text: `📝 ${payload.automationName} - LinkedIn taslağı güncellendi`,
          blocks,
        }),
      });

      const result = await response.json() as { ok: boolean; ts?: string; error?: string };
      return { ok: result.ok, ts: result.ts, error: result.error };
    } catch (error) {
      this.logger.error('Failed to update Slack message', { error: String(error) });
      return { ok: false, error: String(error) };
    }
  }
}

export const slackNotifierService = new SlackNotifierService();
