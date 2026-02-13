import {
  ROLE_PASS_KEYWORDS,
  ROLE_FAIL_KEYWORDS,
  ROLE_TYPE_PASS_KEYWORDS,
  ROLE_TYPE_FAIL_KEYWORDS,
} from '../../config/scoring.js';
import type { UserProfile } from '../../config/user-profile.js';
import type { NormalizedJob, HardFilterResult } from './types.js';

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function containsAny(text: string, keywords: readonly string[]): boolean {
  const lower = normalize(text);
  return keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function filterByRoleLevel(job: NormalizedJob, _profile: UserProfile): HardFilterResult {
  const combined = `${job.title} ${job.description}`.toLowerCase();

  const hasFailKeyword = ROLE_FAIL_KEYWORDS.some((kw) => combined.includes(kw));
  const hasPassKeyword = ROLE_PASS_KEYWORDS.some((kw) => combined.includes(kw));

  if (job.roleLevel === 'senior' || job.roleLevel === 'lead') {
    return { pass: false, reason: `Role level is ${job.roleLevel}`, filter: 'roleLevel' };
  }

  if (hasFailKeyword && !hasPassKeyword) {
    return { pass: false, reason: 'Job requires senior/lead experience', filter: 'roleLevel' };
  }

  return { pass: true };
}

export function filterByRoleType(job: NormalizedJob, _profile: UserProfile): HardFilterResult {
  const combined = `${job.title} ${job.description}`.toLowerCase();

  const isDev = containsAny(combined, ROLE_TYPE_PASS_KEYWORDS);
  const isNonDev = containsAny(combined, ROLE_TYPE_FAIL_KEYWORDS);

  if (isNonDev && !isDev) {
    return { pass: false, reason: 'Not a developer/engineer role', filter: 'roleType' };
  }

  if (!isDev && !isNonDev) {
    return { pass: true };
  }

  return { pass: true };
}

export function filterByWorkModel(job: NormalizedJob, profile: UserProfile): HardFilterResult {
  if (job.workModel === 'unknown') {
    return { pass: true };
  }

  if (job.workModel === 'remote') {
    return { pass: true };
  }

  if (job.workModel === 'hybrid') {
    const location = normalize(job.location ?? '');
    const isAcceptableLocation = profile.preferredLocations.some((loc) =>
      location.includes(loc.toLowerCase()),
    );
    if (isAcceptableLocation || location === '') {
      return { pass: true };
    }
    return {
      pass: false,
      reason: `Hybrid role in ${job.location}, not in preferred locations`,
      filter: 'workModel',
    };
  }

  if (job.workModel === 'onsite') {
    const location = normalize(job.location ?? '');
    const isIstanbul = location.includes('istanbul') || location.includes('İstanbul');
    if (isIstanbul) {
      return { pass: true };
    }
    return {
      pass: false,
      reason: `On-site role in ${job.location ?? 'unknown location'}, not Istanbul`,
      filter: 'workModel',
    };
  }

  return { pass: true };
}

export function filterByLanguage(job: NormalizedJob, profile: UserProfile): HardFilterResult {
  const combined = normalize(`${job.title} ${job.description}`);

  const unsupportedLanguages = [
    'japanese', 'korean', 'chinese', 'mandarin', 'cantonese',
    'arabic', 'hindi', 'russian', 'french', 'german', 'spanish',
    'portuguese', 'italian', 'dutch', 'polish', 'swedish',
  ];

  const requiresUnsupported = unsupportedLanguages.some((lang) => {
    const pattern = new RegExp(`(fluent|native|required|must speak)\\s+${lang}`, 'i');
    return pattern.test(combined);
  });

  if (requiresUnsupported) {
    return { pass: false, reason: 'Requires unsupported language fluency', filter: 'language' };
  }

  const requiresTR = combined.includes('turkish required') || combined.includes('türkçe zorunlu');
  const requiresEN = combined.includes('english required') || combined.includes('ingilizce zorunlu');

  if (requiresTR && !profile.languages.includes('tr')) {
    return { pass: false, reason: 'Requires Turkish', filter: 'language' };
  }

  if (requiresEN && !profile.languages.includes('en')) {
    return { pass: false, reason: 'Requires English', filter: 'language' };
  }

  return { pass: true };
}

type FilterFn = (job: NormalizedJob, profile: UserProfile) => HardFilterResult;

const ALL_HARD_FILTERS: FilterFn[] = [
  filterByRoleLevel,
  filterByRoleType,
  filterByWorkModel,
  filterByLanguage,
];

export function applyHardFilters(job: NormalizedJob, profile: UserProfile): HardFilterResult {
  for (const filter of ALL_HARD_FILTERS) {
    const result = filter(job, profile);
    if (!result.pass) {
      return result;
    }
  }
  return { pass: true };
}
