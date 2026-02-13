import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type TemplateType = 'general-en' | 'general-tr' | 'upwork-proposal' | 'fiverr-gig' | 'bionluk-hizmet';

export class CoverLetterGenerator {
  private templateDir: string;

  constructor(templateDir?: string) {
    this.templateDir = templateDir ?? resolve(__dirname, '../../../templates/cover-letters');
  }

  getTemplate(type: TemplateType): string {
    const paths: Record<TemplateType, string> = {
      'general-en': resolve(this.templateDir, 'general-en.md'),
      'general-tr': resolve(this.templateDir, 'general-tr.md'),
      'upwork-proposal': resolve(this.templateDir, 'platform-specific/upwork-proposal.md'),
      'fiverr-gig': resolve(this.templateDir, 'platform-specific/fiverr-gig-description.md'),
      'bionluk-hizmet': resolve(this.templateDir, 'platform-specific/bionluk-hizmet.md'),
    };

    const path = paths[type];
    if (!existsSync(path)) {
      throw new Error(`Template not found: ${path}`);
    }

    return readFileSync(path, 'utf-8');
  }

  fillTemplate(type: TemplateType, replacements: Record<string, string>): string {
    let template = this.getTemplate(type);

    for (const [key, value] of Object.entries(replacements)) {
      template = template.replaceAll(`[${key}]`, value);
    }

    return template;
  }

  getRecommendedTemplate(platform: string, language: 'tr' | 'en'): TemplateType {
    if (platform === 'upwork') return 'upwork-proposal';
    if (platform === 'fiverr') return 'fiverr-gig';
    if (platform === 'bionluk') return 'bionluk-hizmet';
    return language === 'tr' ? 'general-tr' : 'general-en';
  }
}
