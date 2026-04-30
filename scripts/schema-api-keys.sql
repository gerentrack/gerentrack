-- Tabela de API keys para a API pública v1
-- Rodar no SQL Editor do Supabase

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  active BOOLEAN DEFAULT true,
  rate_limit_per_min INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- RLS: leitura apenas via service_role (server-side)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
