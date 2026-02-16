import { useMemo } from 'react';
import { useI18n } from '../../../../../i18n/useI18n';
import type { ProtoGuidedAnswers } from './protoGuidedFlow';

interface QuestionDefinition {
  key: keyof ProtoGuidedAnswers;
  labelKey: string;
  options: Array<{ value: string; labelKey: string }>;
}

export interface ProtoQuestionFlowProps {
  value: ProtoGuidedAnswers;
  disabled?: boolean;
  onChange: (next: ProtoGuidedAnswers) => void;
}

export function ProtoQuestionFlow({ value, disabled, onChange }: ProtoQuestionFlowProps) {
  const { t } = useI18n();

  const questions = useMemo<QuestionDefinition[]>(
    () => [
      {
        key: 'productType',
        labelKey: 'protoConsole.guided.productType.label',
        options: [
          { value: 'web-app', labelKey: 'protoConsole.guided.productType.webApp' },
          { value: 'api-service', labelKey: 'protoConsole.guided.productType.apiService' },
          { value: 'automation-tool', labelKey: 'protoConsole.guided.productType.automationTool' },
        ],
      },
      {
        key: 'authModel',
        labelKey: 'protoConsole.guided.auth.label',
        options: [
          { value: 'none', labelKey: 'protoConsole.guided.auth.none' },
          { value: 'jwt', labelKey: 'protoConsole.guided.auth.jwt' },
          { value: 'oauth', labelKey: 'protoConsole.guided.auth.oauth' },
        ],
      },
      {
        key: 'dataLayer',
        labelKey: 'protoConsole.guided.data.label',
        options: [
          { value: 'none', labelKey: 'protoConsole.guided.data.none' },
          { value: 'postgres', labelKey: 'protoConsole.guided.data.postgres' },
          { value: 'hybrid', labelKey: 'protoConsole.guided.data.hybrid' },
        ],
      },
      {
        key: 'deploymentTarget',
        labelKey: 'protoConsole.guided.deploy.label',
        options: [
          { value: 'local', labelKey: 'protoConsole.guided.deploy.local' },
          { value: 'cloud-container', labelKey: 'protoConsole.guided.deploy.container' },
          { value: 'serverless', labelKey: 'protoConsole.guided.deploy.serverless' },
        ],
      },
    ],
    []
  );

  const completed = questions.filter((question) => value[question.key]).length;

  return (
    <div className="space-y-3 rounded-lg border border-ak-border bg-ak-surface-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ak-text-primary">{t('protoConsole.guided.title')}</p>
          <p className="text-xs text-ak-text-secondary">{t('protoConsole.guided.subtitle')}</p>
        </div>
        <span className="rounded bg-ak-surface px-2 py-1 text-[11px] text-ak-text-secondary">
          {completed}/4
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {questions.map((question) => (
          <label key={question.key} className="block space-y-1">
            <span className="text-xs font-medium text-ak-text-primary">{t(question.labelKey as never)}</span>
            <select
              value={value[question.key]}
              disabled={disabled}
              onChange={(event) =>
                onChange({
                  ...value,
                  [question.key]: event.target.value,
                })
              }
              className="w-full rounded-lg border border-ak-border bg-ak-surface px-3 py-2 text-sm text-ak-text-primary focus:border-ak-primary focus:outline-none focus:ring-1 focus:ring-ak-primary disabled:opacity-50"
            >
              <option value="">{t('protoConsole.guided.select' as never)}</option>
              {question.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey as never)}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    </div>
  );
}
