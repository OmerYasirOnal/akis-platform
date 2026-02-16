import { createHash } from 'crypto';
import type { VerificationRolloutMode } from '../../services/knowledge/verification/VerificationGateEngine.js';

export type ContractEnforcementMode = 'observe' | 'enforce';

export interface ReliabilityRolloutConfig {
  contractMode: ContractEnforcementMode;
  gateMode: VerificationRolloutMode;
  canaryEnabled: boolean;
  canarySalt: string;
  contractCanaryPercent: number;
  gateCanaryPercent: number;
}

export interface FeatureRolloutDecision<TMode> {
  configuredMode: TMode;
  effectiveMode: TMode | 'observe';
  inCanary: boolean;
  bucket: number | null;
}

export interface ReliabilityRolloutDecision {
  contract: FeatureRolloutDecision<ContractEnforcementMode>;
  gate: FeatureRolloutDecision<VerificationRolloutMode>;
}

function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function computeBucket(identifier: string, salt: string): number {
  const digest = createHash('sha256').update(`${salt}:${identifier}`).digest();
  const value = digest.readUInt32BE(0);
  return value % 100;
}

function resolveFeatureMode<TMode>(
  configuredMode: TMode,
  percent: number,
  bucket: number | null
): FeatureRolloutDecision<TMode> {
  if (bucket === null) {
    return {
      configuredMode,
      effectiveMode: 'observe',
      inCanary: false,
      bucket: null,
    };
  }

  const threshold = clampPercent(percent);
  const inCanary = bucket < threshold;
  return {
    configuredMode,
    effectiveMode: inCanary ? configuredMode : 'observe',
    inCanary,
    bucket,
  };
}

export function resolveReliabilityRollout(
  config: ReliabilityRolloutConfig,
  userId?: string | null
): ReliabilityRolloutDecision {
  if (!config.canaryEnabled) {
    return {
      contract: {
        configuredMode: config.contractMode,
        effectiveMode: config.contractMode,
        inCanary: true,
        bucket: null,
      },
      gate: {
        configuredMode: config.gateMode,
        effectiveMode: config.gateMode,
        inCanary: true,
        bucket: null,
      },
    };
  }

  const normalizedUserId = typeof userId === 'string' && userId.trim().length > 0
    ? userId.trim()
    : null;
  const bucket = normalizedUserId ? computeBucket(normalizedUserId, config.canarySalt) : null;

  return {
    contract: resolveFeatureMode(config.contractMode, config.contractCanaryPercent, bucket),
    gate: resolveFeatureMode(config.gateMode, config.gateCanaryPercent, bucket),
  };
}
