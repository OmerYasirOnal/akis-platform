import { useEffect, useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { aiKeysApi, type AiKeyStatus } from '../../../services/api/ai-keys';

const DashboardSettingsApiKeysPage = () => {
  const [status, setStatus] = useState<AiKeyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const nextStatus = await aiKeysApi.getStatus();
      setStatus(nextStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API key status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  const handleSave = async () => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const nextStatus = await aiKeysApi.saveKey(apiKeyInput.trim());
      setStatus(nextStatus);
      setApiKeyInput('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save API key.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await aiKeysApi.deleteKey();
      setStatus({
        provider: 'openai',
        configured: false,
        last4: null,
        updatedAt: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove API key.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ak-text-primary">
          API Keys
        </h1>
        <p className="text-sm text-ak-text-secondary">
          Store your OpenAI key securely to run Scribe in demo mode.
        </p>
      </header>

      <Card className="space-y-4 bg-ak-surface">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ak-text-primary">
              OpenAI Key
            </h2>
            <p className="text-xs text-ak-text-secondary">
              We only store a masked reference (last 4). Your full key is never shown again.
            </p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-semibold ${status?.configured ? 'bg-green-500/15 text-green-400' : 'bg-ak-danger/15 text-ak-danger'}`}>
            {loading ? 'Checking…' : status?.configured ? 'Configured' : 'Missing'}
          </div>
        </div>

        {status?.configured ? (
          <div className="rounded-xl border border-ak-border bg-ak-surface-2 px-4 py-3 text-sm text-ak-text-secondary">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-ak-text-primary">Key ending in •••• {status.last4}</p>
                {status.updatedAt ? (
                  <p className="text-xs text-ak-text-secondary/80">
                    Updated {new Date(status.updatedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <Button variant="outline" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Removing…' : 'Remove'}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="space-y-3">
          <Input
            label={status?.configured ? 'Update Key' : 'Add Key'}
            type="password"
            placeholder="sk-..."
            value={apiKeyInput}
            onChange={(event) => setApiKeyInput(event.target.value)}
            description="OpenAI keys start with sk-. Your key is encrypted at rest and never shown after submission."
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !apiKeyInput.trim()}>
              {saving ? 'Saving…' : status?.configured ? 'Update Key' : 'Save Key'}
            </Button>
            <Button variant="ghost" onClick={refreshStatus} disabled={loading}>
              Refresh Status
            </Button>
          </div>
          {error ? (
            <p className="text-xs text-ak-danger">{error}</p>
          ) : null}
        </div>
      </Card>
    </div>
  );
};

export default DashboardSettingsApiKeysPage;
