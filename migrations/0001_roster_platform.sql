-- Roster Integral / Cloudflare D1 preparation
-- This migration is intentionally NOT wired to production or executed by CI.
-- All timestamps are UTC epoch milliseconds. OAuth token material must be
-- authenticated-encrypted by the Worker before insertion into oauth_credentials.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS creators (
  creator_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  identity_scope TEXT NOT NULL CHECK (identity_scope IN ('individual_creator', 'shared_project')),
  represented_people_json TEXT NOT NULL DEFAULT '[]',
  public_status TEXT NOT NULL DEFAULT 'active' CHECK (public_status IN ('active', 'paused', 'archived')),
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS creator_accounts (
  account_id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick', 'instagram')),
  account_type TEXT NOT NULL CHECK (account_type IN ('creator_channel', 'social_profile')),
  handle TEXT NOT NULL,
  platform_login TEXT,
  canonical_url TEXT NOT NULL,
  ownership TEXT NOT NULL CHECK (ownership IN ('individual', 'shared')),
  account_status TEXT NOT NULL CHECK (account_status IN ('registered', 'confirmed', 'needs_review', 'revoked')),
  collection_mode TEXT NOT NULL CHECK (collection_mode IN ('manual_link_only', 'public_app_token', 'public_api_key', 'public_client_credentials', 'oauth_user_consent')),
  provider_account_id TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  UNIQUE (platform, handle),
  UNIQUE (platform, provider_account_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_accounts_creator
  ON creator_accounts(creator_id, platform);

CREATE TABLE IF NOT EXISTS creator_consents (
  consent_id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES creator_accounts(account_id) ON DELETE CASCADE,
  provider_subject TEXT NOT NULL,
  consent_status TEXT NOT NULL CHECK (consent_status IN ('pending', 'granted', 'revoked', 'expired')),
  scopes_json TEXT NOT NULL,
  granted_at_ms INTEGER,
  expires_at_ms INTEGER,
  revoked_at_ms INTEGER,
  policy_version TEXT NOT NULL,
  evidence_ref TEXT,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  UNIQUE (account_id, provider_subject, consent_id)
);

CREATE INDEX IF NOT EXISTS idx_creator_consents_active
  ON creator_consents(account_id, consent_status, expires_at_ms);

CREATE TABLE IF NOT EXISTS oauth_credentials (
  credential_id TEXT PRIMARY KEY,
  consent_id TEXT NOT NULL REFERENCES creator_consents(consent_id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('twitch', 'youtube', 'kick')),
  access_token_ciphertext TEXT NOT NULL,
  refresh_token_ciphertext TEXT,
  encryption_key_version TEXT NOT NULL,
  token_type TEXT NOT NULL DEFAULT 'Bearer',
  access_expires_at_ms INTEGER,
  refresh_expires_at_ms INTEGER,
  last_refresh_at_ms INTEGER,
  created_at_ms INTEGER NOT NULL,
  updated_at_ms INTEGER NOT NULL,
  UNIQUE (consent_id)
);

CREATE TABLE IF NOT EXISTS metric_definitions (
  metric_key TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick', 'instagram')),
  label TEXT NOT NULL,
  unit TEXT NOT NULL,
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'consented_private', 'editorial')),
  aggregation_method TEXT NOT NULL,
  interpretation TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (platform, metric_key)
);

CREATE TABLE IF NOT EXISTS metric_observations (
  observation_id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES creator_accounts(account_id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_key TEXT NOT NULL,
  numeric_value REAL,
  text_value TEXT,
  boolean_value INTEGER CHECK (boolean_value IN (0, 1)),
  unit TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('fresh', 'delayed', 'unavailable', 'offline', 'sampled', 'estimated', 'verified_public', 'authorized')),
  visibility TEXT NOT NULL CHECK (visibility IN ('public', 'consented_private', 'editorial')),
  captured_at_ms INTEGER NOT NULL,
  period_from_ms INTEGER,
  period_to_ms INTEGER,
  source TEXT NOT NULL,
  method TEXT NOT NULL,
  interpretation TEXT NOT NULL,
  consent_id TEXT REFERENCES creator_consents(consent_id),
  collector_run_id TEXT,
  CHECK (
    (numeric_value IS NOT NULL) +
    (text_value IS NOT NULL) +
    (boolean_value IS NOT NULL) <= 1
  ),
  FOREIGN KEY (platform, metric_key) REFERENCES metric_definitions(platform, metric_key)
);

CREATE INDEX IF NOT EXISTS idx_metric_observations_creator_time
  ON metric_observations(creator_id, captured_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_metric_observations_account_metric_time
  ON metric_observations(account_id, metric_key, captured_at_ms DESC);

CREATE INDEX IF NOT EXISTS idx_metric_observations_visibility_time
  ON metric_observations(visibility, captured_at_ms DESC);

CREATE TABLE IF NOT EXISTS public_clips (
  clip_id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(creator_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES creator_accounts(account_id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitch', 'youtube', 'kick')),
  provider_clip_id TEXT NOT NULL,
  title TEXT,
  canonical_url TEXT NOT NULL,
  thumbnail_url TEXT,
  game_or_category TEXT,
  view_count INTEGER CHECK (view_count IS NULL OR view_count >= 0),
  published_at_ms INTEGER,
  captured_at_ms INTEGER NOT NULL,
  selection_method TEXT NOT NULL,
  is_editorial_highlight INTEGER NOT NULL DEFAULT 0 CHECK (is_editorial_highlight IN (0, 1)),
  UNIQUE (platform, provider_clip_id)
);

CREATE INDEX IF NOT EXISTS idx_public_clips_creator_date
  ON public_clips(creator_id, published_at_ms DESC);

CREATE TABLE IF NOT EXISTS collector_runs (
  collector_run_id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  collector_name TEXT NOT NULL,
  started_at_ms INTEGER NOT NULL,
  finished_at_ms INTEGER,
  run_status TEXT NOT NULL CHECK (run_status IN ('running', 'success', 'partial', 'failed', 'skipped')),
  expected_accounts INTEGER NOT NULL DEFAULT 0,
  successful_accounts INTEGER NOT NULL DEFAULT 0,
  failed_accounts INTEGER NOT NULL DEFAULT 0,
  result_count INTEGER NOT NULL DEFAULT 0,
  safe_error_summary TEXT,
  code_version TEXT
);

CREATE INDEX IF NOT EXISTS idx_collector_runs_platform_time
  ON collector_runs(platform, started_at_ms DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  audit_event_id TEXT PRIMARY KEY,
  actor_subject TEXT,
  actor_role TEXT NOT NULL CHECK (actor_role IN ('system', 'creator', 'administrator', 'reviewer')),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
  created_at_ms INTEGER NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource
  ON audit_events(resource_type, resource_id, created_at_ms DESC);
