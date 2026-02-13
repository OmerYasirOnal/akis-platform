import type { PlatformType } from '../../config/platforms.js';
import type { Recommendation } from '../../config/scoring.js';

export type JobState =
  | 'discovered'
  | 'shortlisted'
  | 'proposal_drafted'
  | 'awaiting_approval'
  | 'submitted'
  | 'response_received'
  | 'interview_scheduled'
  | 'offer_received'
  | 'hired'
  | 'declined'
  | 'rejected'
  | 'rejected_after_interview'
  | 'no_response'
  | 'archived';

export interface NormalizedJob {
  id: string;
  platform: PlatformType;
  platformJobId: string;
  title: string;
  description: string;
  companyName: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  workModel: 'remote' | 'hybrid' | 'onsite' | 'unknown';
  location: string | null;
  roleLevel: 'intern' | 'junior' | 'mid' | 'senior' | 'lead' | 'unknown';
  techStack: string[];
  url: string;
  discoveredAt: string;
  state: JobState;
  archived: boolean;
  raw?: Record<string, unknown>;
}

export interface ScoreBreakdown {
  techStack: number;
  aiKeywords: number;
  companyQuality: number;
  salaryInfo: number;
  applicationEase: number;
  locationMatch: number;
}

export interface ScoredJob extends NormalizedJob {
  score: number;
  scoreBreakdown: ScoreBreakdown;
  recommendation: Recommendation;
  explanation: string;
}

export interface HardFilterResult {
  pass: boolean;
  reason?: string;
  filter?: string;
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  proposalText: string;
  coverLetter: string | null;
  submittedAt: string | null;
  responseAt: string | null;
  responseType: string | null;
  interviewAt: string | null;
  outcome: string | null;
  notes: string | null;
}

export interface DailyCounters {
  date: string;
  discovered: number;
  shortlisted: number;
  submitted: number;
  outreach: number;
  followUps: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  platform: PlatformType | null;
  jobId: string | null;
  details: Record<string, unknown>;
  outcome: 'success' | 'failure' | 'cancelled';
  approvedBy: 'human' | 'auto' | null;
}
