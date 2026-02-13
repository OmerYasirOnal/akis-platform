import type { PlatformType, AdapterMethod } from '../../config/platforms.js';
import type { NormalizedJob } from '../../core/scoring/types.js';
import type { JobFilters } from '../../core/job-discovery/JobDiscoveryEngine.js';

export interface Proposal {
  coverLetter: string;
  bidAmount?: number;
  bidCurrency?: string;
  estimatedDuration?: string;
  attachments?: string[];
}

export interface SubmissionResult {
  success: boolean;
  submissionId?: string;
  error?: string;
  platform: PlatformType;
}

export interface PlatformProfile {
  platform: PlatformType;
  profileId: string;
  displayName: string;
  title: string;
  description: string;
  skills: string[];
  hourlyRate?: number;
  rateCurrency?: string;
  profileUrl: string;
  completeness: number;
}

export interface ProfileUpdate {
  title?: string;
  description?: string;
  skills?: string[];
  hourlyRate?: number;
}

export interface Conversation {
  id: string;
  platform: PlatformType;
  clientName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
}

export interface PlatformAdapter {
  readonly platform: PlatformType;
  readonly method: AdapterMethod;

  initialize(): Promise<void>;
  teardown(): Promise<void>;

  searchJobs(filters: JobFilters): Promise<NormalizedJob[]>;
  getJobDetails(jobId: string): Promise<NormalizedJob>;
  submitProposal(jobId: string, proposal: Proposal): Promise<SubmissionResult>;

  getProfile(): Promise<PlatformProfile>;
  updateProfile(updates: ProfileUpdate): Promise<void>;

  getConversations?(): Promise<Conversation[]>;
  sendMessage?(conversationId: string, message: string): Promise<void>;
}
