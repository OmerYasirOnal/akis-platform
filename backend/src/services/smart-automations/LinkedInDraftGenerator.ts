/**
 * LinkedIn Draft Generator Service
 * Uses AIService to generate LinkedIn post drafts from aggregated content
 */

import type { FetchedItem, DraftResult } from './types.js';
import { createAIService, type AIService } from '../ai/AIService.js';

/**
 * Prompt templates for different languages
 */
const PROMPTS = {
  tr: {
    system: `Sen profesyonel bir LinkedIn içerik yazarısın. Verilen haber başlıkları ve özetlerden etkileyici, bilgilendirici ve özgün bir LinkedIn paylaşımı hazırlayacaksın.

KURALLAR:
1. Paylaşım 180-300 kelime arasında olmalı
2. Başlık çekici ve dikkat çekici olmalı
3. 3-6 ana çıkarım/insight madde işaretli olarak listele
4. 3-5 ilgili hashtag öner
5. Kaynaklara mutlaka atıfta bulun
6. Orijinal içerik KOPYALAMA - sadece özetle ve yorum ekle
7. Samimi ama profesyonel bir ton kullan
8. Okuyucuyu düşünmeye veya tartışmaya davet et

JSON FORMATI:
{
  "draft": "LinkedIn paylaşım metni...",
  "summary": "Kısa özet (1-2 cümle)",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "sources": ["kaynak1", "kaynak2", ...]
}`,
    user: (items: FetchedItem[], topics: string[]) => `
Konular: ${topics.join(', ')}

Aşağıdaki haberlerden bir LinkedIn paylaşımı oluştur:

${items.map((item, i) => `
${i + 1}. ${item.title}
   Kaynak: ${item.source}
   Link: ${item.link}
   ${item.excerpt ? `Özet: ${item.excerpt}` : ''}
`).join('\n')}

Lütfen yukarıdaki formatta JSON döndür.`,
  },
  en: {
    system: `You are a professional LinkedIn content writer. You will create an engaging, informative, and original LinkedIn post from the given news headlines and summaries.

RULES:
1. Post should be 180-300 words
2. Title should be catchy and attention-grabbing
3. List 3-6 key insights/takeaways as bullet points
4. Suggest 3-5 relevant hashtags
5. Always reference the sources
6. DO NOT copy original content - only summarize and add commentary
7. Use a friendly but professional tone
8. Invite readers to think or discuss

JSON FORMAT:
{
  "draft": "LinkedIn post text...",
  "summary": "Short summary (1-2 sentences)",
  "hashtags": ["hashtag1", "hashtag2", ...],
  "sources": ["source1", "source2", ...]
}`,
    user: (items: FetchedItem[], topics: string[]) => `
Topics: ${topics.join(', ')}

Create a LinkedIn post from these news items:

${items.map((item, i) => `
${i + 1}. ${item.title}
   Source: ${item.source}
   Link: ${item.link}
   ${item.excerpt ? `Summary: ${item.excerpt}` : ''}
`).join('\n')}

Please return JSON in the format specified above.`,
  },
};

/**
 * Default draft result in case of parsing failure
 */
function createFallbackDraft(items: FetchedItem[], language: 'tr' | 'en'): DraftResult {
  const title = language === 'tr' ? 'Günün Öne Çıkanları' : "Today's Highlights";
  const intro = language === 'tr'
    ? 'İşte bugün dikkatimi çeken gelişmeler:'
    : 'Here are the developments that caught my attention today:';

  const bullets = items
    .slice(0, 5)
    .map((item) => `• ${item.title}`)
    .join('\n');

  const sources = items.map((item) => item.link);

  return {
    draft: `${title}\n\n${intro}\n\n${bullets}\n\nKaynaklar: Aşağıdaki linklere bakabilirsiniz.`,
    summary: language === 'tr' ? 'Günlük içerik özeti' : 'Daily content summary',
    hashtags: ['#news', '#insights', '#daily'],
    sources,
  };
}

export class LinkedInDraftGenerator {
  private aiService: AIService;
  private logger: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void };

  constructor(
    aiService?: AIService,
    logger?: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void }
  ) {
    this.aiService = aiService || createAIService();
    this.logger = logger || {
      info: (msg, data) => console.log(`[LinkedInDraftGenerator] ${msg}`, data || ''),
      error: (msg, data) => console.error(`[LinkedInDraftGenerator] ${msg}`, data || ''),
    };
  }

  /**
   * Generate a LinkedIn draft from selected items
   */
  async generateDraft(
    items: FetchedItem[],
    topics: string[],
    language: 'tr' | 'en' = 'tr'
  ): Promise<DraftResult> {
    if (items.length === 0) {
      throw new Error('No items provided for draft generation');
    }

    const prompt = PROMPTS[language];

    try {
      this.logger.info('Generating LinkedIn draft', { itemCount: items.length, language, topics });

      const result = await this.aiService.generateWorkArtifact({
        task: prompt.user(items, topics),
        context: {
          systemPrompt: prompt.system,
          outputFormat: 'json',
        },
      });

      // Parse JSON response
      const content = result.content;
      
      // Try to extract JSON from response
      let parsed: DraftResult;
      try {
        // Handle markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
        parsed = JSON.parse(jsonStr);
      } catch (parseError) {
        this.logger.error('Failed to parse AI response as JSON, using fallback', { error: String(parseError) });
        return createFallbackDraft(items, language);
      }

      // Validate required fields
      if (!parsed.draft || typeof parsed.draft !== 'string') {
        this.logger.error('Invalid draft in AI response, using fallback');
        return createFallbackDraft(items, language);
      }

      // Ensure arrays exist
      parsed.hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
      parsed.sources = Array.isArray(parsed.sources) ? parsed.sources : items.map((i) => i.link);
      parsed.summary = parsed.summary || '';

      // Clean up hashtags (ensure # prefix)
      parsed.hashtags = parsed.hashtags.map((h) =>
        h.startsWith('#') ? h : `#${h}`
      );

      this.logger.info('Draft generated successfully', {
        draftLength: parsed.draft.length,
        hashtagCount: parsed.hashtags.length,
        sourceCount: parsed.sources.length,
      });

      return parsed;
    } catch (error) {
      this.logger.error('Failed to generate draft', { error: String(error) });
      throw error;
    }
  }
}

export const linkedInDraftGenerator = new LinkedInDraftGenerator();
