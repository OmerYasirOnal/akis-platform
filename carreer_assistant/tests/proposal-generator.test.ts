import { describe, it, expect } from 'vitest';
import { CoverLetterGenerator } from '../src/core/materials/CoverLetterGenerator.js';
import { AnswerBank } from '../src/core/materials/AnswerBank.js';

describe('CoverLetterGenerator', () => {
  const generator = new CoverLetterGenerator();

  it('loads general-en template', () => {
    const template = generator.getTemplate('general-en');
    expect(template).toContain('Cover Letter');
    expect(template).toContain('POSITION');
  });

  it('loads general-tr template', () => {
    const template = generator.getTemplate('general-tr');
    expect(template).toContain('Ön Yazı');
  });

  it('loads upwork-proposal template', () => {
    const template = generator.getTemplate('upwork-proposal');
    expect(template).toContain('Upwork');
  });

  it('loads fiverr-gig template', () => {
    const template = generator.getTemplate('fiverr-gig');
    expect(template).toContain('Fiverr');
  });

  it('loads bionluk-hizmet template', () => {
    const template = generator.getTemplate('bionluk-hizmet');
    expect(template).toContain('Bionluk');
  });

  it('fills template placeholders', () => {
    const result = generator.fillTemplate('general-en', {
      POSITION: 'Junior Developer',
      COMPANY: 'Acme Corp',
    });
    expect(result).toContain('Junior Developer');
    expect(result).toContain('Acme Corp');
    expect(result).not.toContain('[POSITION]');
    expect(result).not.toContain('[COMPANY]');
  });

  it('recommends correct template per platform', () => {
    expect(generator.getRecommendedTemplate('upwork', 'en')).toBe('upwork-proposal');
    expect(generator.getRecommendedTemplate('fiverr', 'en')).toBe('fiverr-gig');
    expect(generator.getRecommendedTemplate('bionluk', 'tr')).toBe('bionluk-hizmet');
    expect(generator.getRecommendedTemplate('linkedin', 'en')).toBe('general-en');
    expect(generator.getRecommendedTemplate('linkedin', 'tr')).toBe('general-tr');
  });
});

describe('AnswerBank', () => {
  const bank = new AnswerBank();

  it('loads self intro in Turkish', () => {
    const answer = bank.getSelfIntro('tr');
    expect(answer).toContain('Türkçe');
    expect(answer).toContain('TypeScript');
  });

  it('loads self intro in English', () => {
    const answer = bank.getSelfIntro('en');
    expect(answer).toContain('English');
    expect(answer).toContain('TypeScript');
  });

  it('loads why this role answers', () => {
    const tr = bank.getWhyThisRole('tr');
    const en = bank.getWhyThisRole('en');
    expect(tr).toBeTruthy();
    expect(en).toBeTruthy();
  });

  it('loads salary expectations', () => {
    const salary = bank.getSalaryExpectations();
    expect(salary).toContain('50.000');
    expect(salary).toContain('negotiable');
  });

  it('lists all categories', () => {
    const categories = bank.listCategories();
    expect(categories.length).toBeGreaterThanOrEqual(5);
    expect(categories).toContain('self-intro-tr');
    expect(categories).toContain('self-intro-en');
    expect(categories).toContain('salary-expectations');
  });
});
