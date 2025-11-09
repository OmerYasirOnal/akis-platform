DROP INDEX IF EXISTS idx_oauth_accounts_provider_user_installation;
CREATE UNIQUE INDEX idx_oauth_accounts_provider_user
  ON oauth_accounts (provider, provider_user_id);

