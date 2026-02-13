import { DEFAULT_SCORING_WEIGHTS, type Recommendation } from '../../config/scoring.js';
import type { ScoreBreakdown } from './types.js';

function progressBar(value: number, max: number, width = 30): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

function labelForRecommendation(rec: Recommendation): string {
  switch (rec) {
    case 'apply':
      return 'APPLY';
    case 'consider':
      return 'CONSIDER';
    case 'skip':
      return 'SKIP';
  }
}

export function generateExplanation(
  breakdown: ScoreBreakdown,
  total: number,
  recommendation: Recommendation,
): string {
  const w = DEFAULT_SCORING_WEIGHTS;
  const label = labelForRecommendation(recommendation);

  const lines = [
    `Score: ${total}/100 — ${label}`,
    '━'.repeat(40),
    `Tech Stack:    ${pad(breakdown.techStack)}/${w.techStackMatch}  ${progressBar(breakdown.techStack, w.techStackMatch)}`,
    `AI Keywords:   ${pad(breakdown.aiKeywords)}/${w.aiKeywords}  ${progressBar(breakdown.aiKeywords, w.aiKeywords)}`,
    `Company:       ${pad(breakdown.companyQuality)}/${w.companyQuality}  ${progressBar(breakdown.companyQuality, w.companyQuality)}`,
    `Salary:        ${pad(breakdown.salaryInfo)}/${w.salaryInfo}  ${progressBar(breakdown.salaryInfo, w.salaryInfo)}`,
    `Ease:          ${pad(breakdown.applicationEase)}/${w.applicationEase}  ${progressBar(breakdown.applicationEase, w.applicationEase)}`,
    `Location:      ${pad(breakdown.locationMatch)}/${w.locationMatch}  ${progressBar(breakdown.locationMatch, w.locationMatch)}`,
    '━'.repeat(40),
  ];

  const strengths = getStrengths(breakdown);
  const gaps = getGaps(breakdown);

  if (strengths.length > 0) {
    lines.push(`Strengths: ${strengths.join(', ')}`);
  }
  if (gaps.length > 0) {
    lines.push(`Gaps: ${gaps.join(', ')}`);
  }

  return lines.join('\n');
}

function pad(n: number): string {
  return String(n).padStart(2, ' ');
}

function getStrengths(b: ScoreBreakdown): string[] {
  const strengths: string[] = [];
  const w = DEFAULT_SCORING_WEIGHTS;

  if (b.techStack >= w.techStackMatch * 0.7) strengths.push('Strong tech match');
  if (b.aiKeywords >= w.aiKeywords * 0.5) strengths.push('AI/agent focus');
  if (b.companyQuality >= w.companyQuality * 0.7) strengths.push('Good company');
  if (b.salaryInfo >= w.salaryInfo * 0.7) strengths.push('Good salary');
  if (b.applicationEase >= w.applicationEase * 0.8) strengths.push('Easy application');
  if (b.locationMatch >= w.locationMatch * 0.8) strengths.push('Great location match');

  return strengths;
}

function getGaps(b: ScoreBreakdown): string[] {
  const gaps: string[] = [];
  const w = DEFAULT_SCORING_WEIGHTS;

  if (b.techStack < w.techStackMatch * 0.3) gaps.push('Low tech stack match');
  if (b.aiKeywords === 0) gaps.push('No AI/agent keywords');
  if (b.companyQuality < w.companyQuality * 0.3) gaps.push('Unknown company quality');
  if (b.salaryInfo === 0) gaps.push('No salary info');
  if (b.applicationEase < w.applicationEase * 0.3) gaps.push('Complex application');
  if (b.locationMatch < w.locationMatch * 0.3) gaps.push('Poor location match');

  return gaps;
}

export function generateShortExplanation(
  total: number,
  recommendation: Recommendation,
  topDimension: string,
): string {
  const label = labelForRecommendation(recommendation);
  return `${total}/100 (${label}) — ${topDimension}`;
}
