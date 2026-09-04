CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(254) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT users_email_lowercase_check
    CHECK (email = LOWER(email)),

  CONSTRAINT users_email_unique
    UNIQUE (email)
);

CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash CHAR(64) NOT NULL,
  family_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  replaced_by_token_id UUID REFERENCES refresh_tokens(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT refresh_tokens_token_hash_unique
    UNIQUE (token_hash),

  CONSTRAINT refresh_tokens_expiry_after_creation_check
    CHECK (expires_at > created_at)
);

CREATE INDEX refresh_tokens_active_lookup_idx
  ON refresh_tokens (token_hash)
  WHERE revoked_at IS NULL;

CREATE INDEX refresh_tokens_family_idx
  ON refresh_tokens (family_id);