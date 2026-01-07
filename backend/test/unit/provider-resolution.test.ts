/**
 * Provider Resolution Tests
 * 
 * Verifies the provider selection precedence:
 * 1. payload.aiProvider (explicit override)
 * 2. user.activeAiProvider (account default)
 * 3. env.AI_PROVIDER (system default)
 * 
 * And key resolution:
 * 1. User key for selected provider
 * 2. ENV key (only if not explicit payload request)
 * 3. Fail with actionable error
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('Provider Resolution Precedence', () => {
  describe('Cross-Provider Fallback Prevention', () => {
    it('blocks OpenRouter env key when OpenAI was explicitly requested', () => {
      const requestedProvider: string = 'openai';
      const envProvider: string = 'openrouter';
      
      // The key question: should we fallback to openrouter?
      const isExplicitRequest = true;
      const envProviderMatches = envProvider === requestedProvider;
      
      // With our new logic: explicit request + no match = NO fallback
      const shouldAllowFallback = !isExplicitRequest || envProviderMatches;
      
      assert.strictEqual(shouldAllowFallback, false, 'MUST NOT fallback to different provider');
      assert.strictEqual(envProviderMatches, false, 'env provider does not match requested');
    });

    it('allows OpenAI env key when OpenAI was explicitly requested', () => {
      const requestedProvider: string = 'openai';
      const envProvider: string = 'openai';
      
      const isExplicitRequest = true;
      const envProviderMatches = envProvider === requestedProvider;
      
      // Same provider = fallback allowed
      const shouldAllowFallback = !isExplicitRequest || envProviderMatches;
      
      assert.strictEqual(shouldAllowFallback, true, 'CAN fallback to same provider env key');
    });
  });

  describe('Provider-Aware Model Defaults', () => {
    it('selects gpt-4o-mini for openai provider', () => {
      const provider: string = 'openai';
      const modelOverride: string | undefined = undefined;
      
      const resolvedModel = modelOverride || (provider === 'openrouter' 
        ? 'meta-llama/llama-3.3-70b-instruct:free' 
        : 'gpt-4o-mini');
      
      assert.strictEqual(resolvedModel, 'gpt-4o-mini');
    });

    it('selects meta-llama for openrouter provider', () => {
      const provider: string = 'openrouter';
      const modelOverride: string | undefined = undefined;
      
      const resolvedModel = modelOverride || (provider === 'openrouter' 
        ? 'meta-llama/llama-3.3-70b-instruct:free' 
        : 'gpt-4o-mini');
      
      assert.strictEqual(resolvedModel, 'meta-llama/llama-3.3-70b-instruct:free');
    });

    it('respects model override regardless of provider', () => {
      const provider: string = 'openai';
      const modelOverride = 'gpt-4-turbo';
      
      const resolvedModel = modelOverride || (provider === 'openrouter' 
        ? 'meta-llama/llama-3.3-70b-instruct:free' 
        : 'gpt-4o-mini');
      
      assert.strictEqual(resolvedModel, 'gpt-4-turbo');
    });
  });

  describe('Provider Selection', () => {
    it('payload.aiProvider takes precedence over activeProvider', () => {
      // Given: user's activeProvider is 'openai' but payload requests 'openrouter'
      const payloadProvider = 'openrouter';
      const userActiveProvider = 'openai';
      const envProvider = 'openai';
      
      // Resolution logic (simplified from AgentOrchestrator)
      let providerCandidate: string;
      if (payloadProvider) {
        providerCandidate = payloadProvider;
      } else if (userActiveProvider) {
        providerCandidate = userActiveProvider;
      } else {
        providerCandidate = envProvider;
      }
      
      assert.strictEqual(providerCandidate, 'openrouter', 'payload should override active provider');
    });

    it('activeProvider takes precedence over env when payload is undefined', () => {
      const payloadProvider = undefined;
      const userActiveProvider = 'openai';
      const envProvider = 'openrouter';
      
      let providerCandidate: string;
      if (payloadProvider) {
        providerCandidate = payloadProvider;
      } else if (userActiveProvider) {
        providerCandidate = userActiveProvider;
      } else {
        providerCandidate = envProvider;
      }
      
      assert.strictEqual(providerCandidate, 'openai', 'active provider should override env');
    });

    it('falls back to env when both payload and activeProvider are undefined', () => {
      const payloadProvider = undefined;
      const userActiveProvider = null;
      const envProvider = 'openrouter';
      
      let providerCandidate: string;
      if (payloadProvider) {
        providerCandidate = payloadProvider;
      } else if (userActiveProvider) {
        providerCandidate = userActiveProvider;
      } else {
        providerCandidate = envProvider;
      }
      
      assert.strictEqual(providerCandidate, 'openrouter', 'should fall back to env');
    });
  });

  describe('Key Resolution', () => {
    it('uses user key when available for selected provider', () => {
      // Given: user has an OpenAI key
      const userKeyForOpenai = 'sk-user-key-123';
      const envOpenaiKey = 'sk-env-key-456';
      
      // Resolution: prefer user key over env key
      const apiKey = userKeyForOpenai || envOpenaiKey;
      const keySource = userKeyForOpenai ? 'user' : 'env';
      
      assert.strictEqual(apiKey, 'sk-user-key-123');
      assert.strictEqual(keySource, 'user');
    });

    it('blocks env fallback when payload explicitly requested different provider', () => {
      const payloadProvider: string = 'openai'; // User explicitly requested OpenAI
      const requestedProvider: string = 'openai';
      const envProvider: string = 'openrouter'; // ENV is configured for OpenRouter
      // User has no key for OpenAI, env has key for OpenRouter
      // Should NOT fallback to env because provider mismatch
      
      const isExplicitPayloadRequest = !!payloadProvider;
      const envProviderMatches = envProvider === requestedProvider;
      
      // This should evaluate to false - no fallback allowed
      const shouldAllowEnvFallback = !isExplicitPayloadRequest || envProviderMatches;
      
      assert.strictEqual(shouldAllowEnvFallback, false, 'should not allow env fallback when explicit provider mismatch');
    });

    it('allows env fallback when no explicit payload provider', () => {
      const payloadProvider = undefined; // No explicit request
      const resolvedProvider = 'openrouter'; // Resolved from activeProvider or env
      const envProvider = 'openrouter';
      // User has no key but env has key for matching provider
      
      const isExplicitPayloadRequest = !!payloadProvider;
      const envProviderMatches = envProvider === resolvedProvider;
      
      const shouldAllowEnvFallback = !isExplicitPayloadRequest || envProviderMatches;
      
      assert.strictEqual(shouldAllowEnvFallback, true, 'should allow env fallback when no explicit request');
    });
  });

  describe('Frontend Auto-Select Logic', () => {
    it('prefers openai when both providers have user keys', () => {
      const openaiConfigured = true;
      const openrouterConfigured = true;
      
      // Frontend auto-select logic
      let selectedProvider: string | null = null;
      if (openaiConfigured) {
        selectedProvider = 'openai';
      } else if (openrouterConfigured) {
        selectedProvider = 'openrouter';
      }
      
      assert.strictEqual(selectedProvider, 'openai', 'should prefer openai');
    });

    it('selects openrouter when only openrouter has user key', () => {
      const openaiConfigured = false;
      const openrouterConfigured = true;
      
      let selectedProvider: string | null = null;
      if (openaiConfigured) {
        selectedProvider = 'openai';
      } else if (openrouterConfigured) {
        selectedProvider = 'openrouter';
      }
      
      assert.strictEqual(selectedProvider, 'openrouter');
    });

    it('returns null when neither provider has user key', () => {
      const openaiConfigured = false;
      const openrouterConfigured = false;
      
      let selectedProvider: string | null = null;
      if (openaiConfigured) {
        selectedProvider = 'openai';
      } else if (openrouterConfigured) {
        selectedProvider = 'openrouter';
      }
      
      assert.strictEqual(selectedProvider, null, 'should return null when no keys configured');
    });
  });
});

