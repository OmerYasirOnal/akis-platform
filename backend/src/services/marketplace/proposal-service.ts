import type { ProposalDraft, MarketplaceJobContext, MarketplaceProfileContext } from './types.js';

function escapeUnsafeText(input: string): string {
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

function shortlistSkills(skills: string[]): string[] {
  return [...new Set(skills.map((skill) => skill.trim()).filter(Boolean))].slice(0, 6);
}

function buildTemplate(input: {
  profile: MarketplaceProfileContext;
  job: MarketplaceJobContext;
  skills: string[];
  missingSkills: string[];
}): string {
  const { profile, job, skills, missingSkills } = input;

  const safeTitle = escapeUnsafeText(job.title);
  const safeHeadline = escapeUnsafeText(profile.headline ?? 'Freelance Professional');
  const safeBio = escapeUnsafeText(profile.bio ?? 'I focus on delivering reliable and measurable outcomes.');

  const highlightSkills = shortlistSkills(skills).join(', ') || 'relevant technical skills';
  const missingText = missingSkills.length > 0
    ? `I also identified ${missingSkills.join(', ')} as important for this role and can close these gaps with a fast ramp-up plan.`
    : 'My current skill set already aligns closely with your requirements.';

  return [
    `Hello,`,
    '',
    `I am interested in your project: ${safeTitle}.`,
    `I work as ${safeHeadline} and bring experience in ${highlightSkills}.`,
    '',
    `${safeBio}`,
    '',
    `${missingText}`,
    '',
    'If selected, I can start with a short discovery milestone and provide a clear delivery plan with checkpoints.',
    '',
    'Best regards,',
    'AKIS Workstream Talent',
  ].join('\n');
}

function buildSafeLLMPrompt(input: {
  profile: MarketplaceProfileContext;
  job: MarketplaceJobContext;
  skills: string[];
  missingSkills: string[];
}): string {
  return [
    'Generate a concise freelance proposal using only the provided data.',
    'Do not fabricate experience, certifications, client names, or legal claims.',
    'Do not include sensitive personal data.',
    'Use a professional tone and less than 220 words.',
    `Profile headline: ${input.profile.headline ?? ''}`,
    `Profile bio: ${input.profile.bio ?? ''}`,
    `Skills: ${input.skills.join(', ')}`,
    `Job title: ${input.job.title}`,
    `Job description: ${input.job.description.slice(0, 1500)}`,
    `Missing skills: ${input.missingSkills.join(', ')}`,
  ].join('\n');
}

export async function generateProposalDraft(input: {
  profile: MarketplaceProfileContext;
  job: MarketplaceJobContext;
  skills: string[];
  missingSkills: string[];
  llmGenerate?: (prompt: string) => Promise<string>;
}): Promise<ProposalDraft> {
  const template = buildTemplate(input);
  const llmEnabled = process.env.MARKETPLACE_PROPOSAL_LLM_ENABLED === 'true';

  if (!llmEnabled || !input.llmGenerate) {
    return {
      content: template,
      source: 'template',
      metadata: {
        llmEnabled,
        fallback: true,
      },
    };
  }

  try {
    const prompt = buildSafeLLMPrompt(input);
    const llmOutput = await input.llmGenerate(prompt);

    const safeOutput = escapeUnsafeText(llmOutput || '');
    if (!safeOutput) {
      return {
        content: template,
        source: 'template',
        metadata: {
          llmEnabled,
          fallback: true,
          reason: 'EMPTY_LLM_RESPONSE',
        },
      };
    }

    return {
      content: safeOutput,
      source: 'llm',
      metadata: {
        llmEnabled,
        fallback: false,
      },
    };
  } catch (error) {
    return {
      content: template,
      source: 'template',
      metadata: {
        llmEnabled,
        fallback: true,
        reason: 'LLM_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

export { buildTemplate as renderProposalTemplate };
