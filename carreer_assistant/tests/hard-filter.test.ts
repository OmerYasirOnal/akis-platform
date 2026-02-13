import { describe, it, expect } from 'vitest';
import {
  filterByRoleLevel,
  filterByRoleType,
  filterByWorkModel,
  filterByLanguage,
  applyHardFilters,
} from '../src/core/scoring/HardFilter.js';
import { DEFAULT_USER_PROFILE } from '../src/config/user-profile.js';
import type { NormalizedJob } from '../src/core/scoring/types.js';

const profile = DEFAULT_USER_PROFILE;

function makeJob(overrides: Partial<NormalizedJob> = {}): NormalizedJob {
  return {
    id: 'test-1',
    platform: 'upwork',
    platformJobId: 'up-1',
    title: 'Junior Developer',
    description: 'We need a developer',
    companyName: 'Test Corp',
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    hourlyRateMin: null,
    hourlyRateMax: null,
    workModel: 'remote',
    location: null,
    roleLevel: 'junior',
    techStack: [],
    url: 'https://example.com',
    discoveredAt: new Date().toISOString(),
    state: 'discovered',
    archived: false,
    ...overrides,
  };
}

describe('filterByRoleLevel', () => {
  it('passes junior roles', () => {
    const job = makeJob({ title: 'Junior Developer', roleLevel: 'junior' });
    expect(filterByRoleLevel(job, profile).pass).toBe(true);
  });

  it('passes intern roles', () => {
    const job = makeJob({ title: 'Software Engineering Intern', roleLevel: 'intern' });
    expect(filterByRoleLevel(job, profile).pass).toBe(true);
  });

  it('fails senior roles', () => {
    const job = makeJob({ title: 'Senior Developer', roleLevel: 'senior' });
    expect(filterByRoleLevel(job, profile).pass).toBe(false);
  });

  it('fails lead roles', () => {
    const job = makeJob({ title: 'Lead Engineer', roleLevel: 'lead' });
    expect(filterByRoleLevel(job, profile).pass).toBe(false);
  });

  it('fails roles with 5+ years requirement', () => {
    const job = makeJob({
      title: 'Developer',
      description: 'Must have 5+ years of experience',
      roleLevel: 'unknown',
    });
    expect(filterByRoleLevel(job, profile).pass).toBe(false);
  });

  it('passes when both junior and senior keywords present (prefers pass)', () => {
    const job = makeJob({
      title: 'Junior to Senior Developer',
      description: 'Open to junior candidates',
      roleLevel: 'unknown',
    });
    expect(filterByRoleLevel(job, profile).pass).toBe(true);
  });
});

describe('filterByRoleType', () => {
  it('passes developer roles', () => {
    const job = makeJob({ title: 'Junior Web Developer' });
    expect(filterByRoleType(job, profile).pass).toBe(true);
  });

  it('passes engineer roles', () => {
    const job = makeJob({ title: 'Software Engineer Intern' });
    expect(filterByRoleType(job, profile).pass).toBe(true);
  });

  it('fails project manager roles', () => {
    const job = makeJob({ title: 'Project Manager', description: 'Manage the project team' });
    expect(filterByRoleType(job, profile).pass).toBe(false);
  });

  it('passes unknown roles (benefit of doubt)', () => {
    const job = makeJob({ title: 'Intern', description: 'Help with tasks' });
    expect(filterByRoleType(job, profile).pass).toBe(true);
  });
});

describe('filterByWorkModel', () => {
  it('passes remote jobs', () => {
    const job = makeJob({ workModel: 'remote' });
    expect(filterByWorkModel(job, profile).pass).toBe(true);
  });

  it('passes Istanbul hybrid', () => {
    const job = makeJob({ workModel: 'hybrid', location: 'Istanbul, Turkey' });
    expect(filterByWorkModel(job, profile).pass).toBe(true);
  });

  it('fails non-Istanbul onsite', () => {
    const job = makeJob({ workModel: 'onsite', location: 'Berlin, Germany' });
    expect(filterByWorkModel(job, profile).pass).toBe(false);
  });

  it('passes Istanbul onsite', () => {
    const job = makeJob({ workModel: 'onsite', location: 'Istanbul' });
    expect(filterByWorkModel(job, profile).pass).toBe(true);
  });

  it('passes unknown work model', () => {
    const job = makeJob({ workModel: 'unknown' });
    expect(filterByWorkModel(job, profile).pass).toBe(true);
  });
});

describe('filterByLanguage', () => {
  it('passes English/Turkish jobs', () => {
    const job = makeJob({ description: 'Looking for developers, English communication required' });
    expect(filterByLanguage(job, profile).pass).toBe(true);
  });

  it('fails jobs requiring unsupported languages', () => {
    const job = makeJob({ description: 'Must speak fluent Japanese to work with our Tokyo team' });
    expect(filterByLanguage(job, profile).pass).toBe(false);
  });

  it('passes generic jobs without language requirements', () => {
    const job = makeJob({ description: 'Build a website for our company' });
    expect(filterByLanguage(job, profile).pass).toBe(true);
  });
});

describe('applyHardFilters', () => {
  it('passes a good junior remote job', () => {
    const job = makeJob({
      title: 'Junior React Developer',
      description: 'Looking for junior developers to join our remote team',
      workModel: 'remote',
      roleLevel: 'junior',
    });
    expect(applyHardFilters(job, profile).pass).toBe(true);
  });

  it('fails on first failing filter', () => {
    const job = makeJob({
      title: 'Senior Project Manager',
      roleLevel: 'senior',
      workModel: 'onsite',
      location: 'London',
    });
    const result = applyHardFilters(job, profile);
    expect(result.pass).toBe(false);
    expect(result.reason).toBeDefined();
  });
});
