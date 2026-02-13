import { chatCompletion } from '../../ai/OpenAIClient.js';
import { PROMPTS } from '../../ai/PromptTemplates.js';
import type { UserProfile } from '../../config/user-profile.js';
import type { NormalizedJob } from '../scoring/types.js';

export interface GeneratedProposal {
  coverLetter: string;
  bidAmount?: number;
  bidCurrency?: string;
  estimatedDuration?: string;
  platform: string;
  language: 'tr' | 'en';
}

export class ProposalGenerator {
  private profile: UserProfile;

  constructor(profile: UserProfile) {
    this.profile = profile;
  }

  async generateProposal(job: NormalizedJob): Promise<GeneratedProposal> {
    const language = this.detectLanguage(job);
    const platformStyle = this.getPlatformStyle(job.platform);

    const userPrompt = `Generate a ${platformStyle.type} for the following job:

Job Title: ${job.title}
Company: ${job.companyName}
Platform: ${job.platform}
Description: ${job.description.slice(0, 2000)}
Tech Stack Required: ${job.techStack.join(', ')}
Work Model: ${job.workModel}
${job.salaryMin ? `Budget: ${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}` : 'Budget: Not specified'}

My Profile:
- Name: ${this.profile.name}
- Tech Stack: ${this.profile.techStack.join(', ')}
- Experience: Building AKIS Platform (AI agent orchestration, 3 agents, 1391 tests)
- Level: Junior / Intern
- Languages: Turkish, English

${platformStyle.instructions}
Language: Write in ${language === 'tr' ? 'Turkish' : 'English'}`;

    const coverLetter = await chatCompletion(
      PROMPTS.GENERATE_PROPOSAL,
      userPrompt,
      { temperature: 0.7, maxTokens: 1000 },
    );

    return {
      coverLetter,
      bidAmount: this.estimateBid(job),
      bidCurrency: job.salaryCurrency ?? 'USD',
      estimatedDuration: '7 days',
      platform: job.platform,
      language,
    };
  }

  async generateCoverLetter(job: NormalizedJob): Promise<string> {
    const language = this.detectLanguage(job);

    const userPrompt = `Write a cover letter for:

Position: ${job.title}
Company: ${job.companyName}
Description: ${job.description.slice(0, 1500)}
Required Tech: ${job.techStack.join(', ')}

My background:
- Final-year CS student
- TypeScript full-stack: React, Fastify, PostgreSQL, Drizzle ORM
- Built AI agent orchestration platform (3 agents, 1391 tests)
- Looking for junior/intern role

Language: ${language === 'tr' ? 'Turkish' : 'English'}`;

    return chatCompletion(PROMPTS.GENERATE_COVER_LETTER, userPrompt, {
      temperature: 0.6,
      maxTokens: 800,
    });
  }

  private detectLanguage(job: NormalizedJob): 'tr' | 'en' {
    const text = `${job.title} ${job.description} ${job.companyName}`.toLowerCase();
    const turkishIndicators = ['türkiye', 'istanbul', 'ankara', 'izmir', 'maaş', 'deneyim', 'başvuru', 'geliştirici', 'yazılımcı'];
    const hasTurkish = turkishIndicators.some((kw) => text.includes(kw));

    if (job.platform === 'bionluk') return 'tr';
    if (hasTurkish) return 'tr';
    return 'en';
  }

  private getPlatformStyle(platform: string): { type: string; instructions: string } {
    switch (platform) {
      case 'upwork':
        return {
          type: 'Upwork proposal',
          instructions: 'Keep under 200 words. Lead with deliverable. Include 3-step approach. Mention availability.',
        };
      case 'freelancer':
        return {
          type: 'Freelancer.com bid description',
          instructions: 'Keep under 200 words. Focus on relevant skills. Include estimated timeline and approach.',
        };
      case 'fiverr':
        return {
          type: 'Fiverr buyer request response',
          instructions: 'Keep under 150 words. Very concise and direct. Focus on what you will deliver.',
        };
      case 'bionluk':
        return {
          type: 'Bionluk teklif mesajı',
          instructions: 'Türkçe yaz. 150 kelimeden kısa. Doğrudan ne yapacağını anlat. Teslim süresi belirt.',
        };
      default:
        return {
          type: 'job application cover letter',
          instructions: 'Professional format. Under 200 words. Specific to the role.',
        };
    }
  }

  private estimateBid(job: NormalizedJob): number | undefined {
    if (job.hourlyRateMin) {
      return Math.max(job.hourlyRateMin, 15);
    }
    if (job.salaryMin && job.salaryCurrency === 'USD') {
      return job.salaryMin;
    }
    if (job.platform === 'upwork' || job.platform === 'freelancer') {
      return 20;
    }
    return undefined;
  }
}
