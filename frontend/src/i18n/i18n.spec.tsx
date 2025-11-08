import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { I18nProvider } from './I18nProvider';
import { useI18n } from './useI18n';

function TestConsumer() {
  const { t, setLocale } = useI18n();

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

describe('I18nProvider', () => {
  it('loads default locale and switches to Turkish', async () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    await waitFor(() =>
      expect(screen.getByTestId('title').textContent).toBe('AKIS Platform')
    );

    fireEvent.click(screen.getByTestId('switch-tr'));

    await waitFor(() =>
      expect(screen.getByTestId('title').textContent).toBe('AKIS Platformu')
    );
  });
});

