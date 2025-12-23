/**
 * PR-2: PRMetadataCard Tests
 * Tests for PR link rendering - no more #undefined
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PRMetadataCard } from '../PRMetadataCard';

describe('PRMetadataCard', () => {
  describe('PR-2: PR link rendering', () => {
    it('should show "View Pull Request" when both title and number are missing', () => {
      const result = {
        pullRequest: {
          url: 'https://github.com/owner/repo/pull/123',
          // No title, no number
        },
      };

      render(<PRMetadataCard result={result} isDryRun={false} jobState="completed" />);
      
      const link = screen.getByTestId('pr-link');
      expect(link.textContent).toBe('View Pull Request');
      expect(link.textContent).not.toContain('undefined');
    });

    it('should show PR number when title is missing but number exists', () => {
      const result = {
        pullRequest: {
          url: 'https://github.com/owner/repo/pull/42',
          number: 42,
          // No title
        },
      };

      render(<PRMetadataCard result={result} isDryRun={false} jobState="completed" />);
      
      const link = screen.getByTestId('pr-link');
      expect(link.textContent).toBe('Pull Request #42');
    });

    it('should show PR title when available', () => {
      const result = {
        pullRequest: {
          url: 'https://github.com/owner/repo/pull/123',
          number: 123,
          title: 'Add new documentation',
        },
      };

      render(<PRMetadataCard result={result} isDryRun={false} jobState="completed" />);
      
      const link = screen.getByTestId('pr-link');
      expect(link.textContent).toBe('Add new documentation');
    });

    it('should not show number badge when number is 0', () => {
      const result = {
        pullRequest: {
          url: 'https://github.com/owner/repo/pull/0',
          number: 0,
          title: 'Test PR',
        },
      };

      render(<PRMetadataCard result={result} isDryRun={false} jobState="completed" />);
      
      // Should not have #0 badge
      expect(screen.queryByText('#0')).toBeNull();
    });

    it('should show number badge when number is valid', () => {
      const result = {
        pullRequest: {
          url: 'https://github.com/owner/repo/pull/99',
          number: 99,
          title: 'Feature PR',
        },
      };

      render(<PRMetadataCard result={result} isDryRun={false} jobState="completed" />);
      
      expect(screen.getByText('#99')).toBeTruthy();
    });

    it('should not render PR section when no PR info', () => {
      const result = {
        // No pullRequest object
      };

      const { container } = render(
        <PRMetadataCard result={result} isDryRun={false} jobState="completed" />
      );
      
      // Card should not render or should show appropriate empty state
      expect(screen.queryByTestId('pr-link')).toBeNull();
    });
  });

  describe('Job state handling', () => {
    it('should show pending notice for pending jobs', () => {
      const payload = { owner: 'test', repo: 'repo' };

      render(
        <PRMetadataCard 
          result={{}} 
          payload={payload} 
          isDryRun={false} 
          jobState="pending" 
        />
      );
      
      expect(screen.getByText('Waiting to Start')).toBeTruthy();
    });

    it('should show running notice for running jobs', () => {
      const payload = { owner: 'test', repo: 'repo' };

      render(
        <PRMetadataCard 
          result={{}} 
          payload={payload} 
          isDryRun={false} 
          jobState="running" 
        />
      );
      
      expect(screen.getByText('In Progress')).toBeTruthy();
    });

    it('should show awaiting approval notice', () => {
      const payload = { owner: 'test', repo: 'repo' };

      render(
        <PRMetadataCard 
          result={{}} 
          payload={payload} 
          isDryRun={false} 
          jobState="awaiting_approval" 
        />
      );
      
      expect(screen.getByText('Awaiting Approval')).toBeTruthy();
    });

    it('should show error notice for failed jobs without PR', () => {
      const payload = { owner: 'test', repo: 'repo' };

      render(
        <PRMetadataCard 
          result={{}} 
          payload={payload} 
          isDryRun={false} 
          jobState="failed" 
        />
      );
      
      expect(screen.getByText('Pull Request Not Created')).toBeTruthy();
    });
  });
});

