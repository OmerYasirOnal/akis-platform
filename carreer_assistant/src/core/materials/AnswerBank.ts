import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export type AnswerCategory =
  | 'self-intro-tr'
  | 'self-intro-en'
  | 'why-this-role-tr'
  | 'why-this-role-en'
  | 'salary-expectations';

export class AnswerBank {
  private answersDir: string;

  constructor(answersDir?: string) {
    this.answersDir = answersDir ?? resolve(__dirname, '../../../templates/answers');
  }

  getAnswer(category: AnswerCategory): string {
    const path = resolve(this.answersDir, `${category}.md`);
    if (!existsSync(path)) {
      throw new Error(`Answer template not found: ${path}`);
    }
    return readFileSync(path, 'utf-8');
  }

  listCategories(): AnswerCategory[] {
    if (!existsSync(this.answersDir)) return [];

    return readdirSync(this.answersDir)
      .filter((f) => f.endsWith('.md'))
      .map((f) => basename(f, '.md') as AnswerCategory);
  }

  getSelfIntro(language: 'tr' | 'en'): string {
    return this.getAnswer(language === 'tr' ? 'self-intro-tr' : 'self-intro-en');
  }

  getWhyThisRole(language: 'tr' | 'en'): string {
    return this.getAnswer(language === 'tr' ? 'why-this-role-tr' : 'why-this-role-en');
  }

  getSalaryExpectations(): string {
    return this.getAnswer('salary-expectations');
  }
}
