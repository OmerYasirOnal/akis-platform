import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEffect } from 'react';

import { I18nProvider } from './I18nProvider';
import { useI18n } from './useI18n';

describe('I18nProvider', () => {
  it('loads default locale and switches to Turkish', async () => {
    const mountSpy = vi.fn();

    function TestConsumerWithMount() {
      const { t, setLocale } = useI18n();

      // Track consumer lifetime to assert locale switches don't remount the subtree.
      useEffect(() => {
        mountSpy();
      }, []);

      return (
        <>
          <span data-testid="title">{t('app.title')}</span>
          <button
            data-testid="switch-tr"
            onClick={() => {
              void setLocale('tr');
            }}
          >
            Switch to tr
          </button>
        </>
      );
    }

    render(
      <I18nProvider>
        <TestConsumerWithMount />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('title').textContent).toBe('AKIS Platform')
    );

    fireEvent.click(screen.getByTestId('switch-tr'));

    await waitFor(() =>
      expect(screen.getByTestId('title').textContent).toBe('AKIS Platformu')
    );

    expect(mountSpy).toHaveBeenCalledTimes(1);
  });
});
