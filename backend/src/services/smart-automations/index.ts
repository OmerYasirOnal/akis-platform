/**
 * Smart Automations Services
 * Export all smart automation related services
 */

export * from './types.js';
export { RSSFetcherService, rssFetcherService, hashLink } from './RSSFetcherService.js';
export { ContentAggregatorService, contentAggregatorService } from './ContentAggregatorService.js';
export { LinkedInDraftGenerator, linkedInDraftGenerator } from './LinkedInDraftGenerator.js';
export { SlackNotifierService, slackNotifierService } from './SlackNotifierService.js';
export { AutomationExecutor, automationExecutor } from './AutomationExecutor.js';
export {
  AutomationScheduler,
  getAutomationScheduler,
  startAutomationScheduler,
  stopAutomationScheduler,
} from './AutomationScheduler.js';
