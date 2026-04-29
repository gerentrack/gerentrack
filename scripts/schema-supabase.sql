-- GERENTRACK - Schema PostgreSQL (Supabase)
-- Dados consolidados pos-competicao

-- Equipes
CREATE TABLE equipes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  sigla TEXT,
  estado CHAR(2),
  federada BOOLEAN DEFAULT false,
  organizador_id TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Atletas (registro cross-competicao)
CREATE TABLE atletas (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  sexo CHAR(1),
  ano_nasc INTEGER,
  data_nasc TEXT,
  cpf TEXT,
  cbat TEXT,
  equipe_id TEXT REFERENCES equipes(id),
  clube TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Competicoes (espelho do Firestore eventos)
CREATE TABLE competicoes (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT,
  cidade TEXT,
  estado CHAR(2),
  data TEXT,
  data_fim TEXT,
  organizador_id TEXT,
  status TEXT DEFAULT 'finalizada',
  consolidado_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Resultados (consolidados pos-competicao)
CREATE TABLE resultados (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  competicao_id TEXT NOT NULL REFERENCES competicoes(id),
  atleta_id TEXT NOT NULL,
  prova_id TEXT NOT NULL,
  prova_nome TEXT,
  categoria_id TEXT NOT NULL,
  sexo CHAR(1) NOT NULL,
  fase TEXT DEFAULT 'Final',
  marca TEXT,
  marca_num NUMERIC,
  posicao INTEGER,
  vento TEXT,
  status TEXT,
  pontos_equipe INTEGER,
  equipe_id TEXT,
  equipe_nome TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(competicao_id, atleta_id, prova_id, categoria_id, sexo, fase)
);

-- Ranking (entradas extraidas pos-competicao)
CREATE TABLE ranking (
  id TEXT PRIMARY KEY,
  competicao_id TEXT NOT NULL REFERENCES competicoes(id),
  evento_nome TEXT,
  evento_data TEXT,
  evento_uf TEXT,
  prova_id TEXT NOT NULL,
  prova_nome TEXT,
  unidade TEXT DEFAULT 's',
  atleta_id TEXT NOT NULL,
  atleta_nome TEXT,
  atleta_cbat TEXT,
  atleta_uf TEXT,
  atleta_clube TEXT,
  equipe_id TEXT,
  categoria_id TEXT NOT NULL,
  sexo CHAR(1) NOT NULL,
  marca TEXT,
  marca_num NUMERIC,
  vento TEXT,
  vento_assistido BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Indices
CREATE INDEX idx_resultados_competicao ON resultados(competicao_id);
CREATE INDEX idx_resultados_atleta ON resultados(atleta_id);
CREATE INDEX idx_resultados_prova_cat_sexo ON resultados(prova_id, categoria_id, sexo, marca_num);
CREATE INDEX idx_ranking_prova_cat_sexo ON ranking(prova_id, categoria_id, sexo, marca_num);
CREATE INDEX idx_ranking_competicao ON ranking(competicao_id);
CREATE INDEX idx_ranking_atleta ON ranking(atleta_id);
CREATE INDEX idx_atletas_cbat ON atletas(cbat);
CREATE INDEX idx_atletas_cpf ON atletas(cpf);
CREATE INDEX idx_competicoes_slug ON competicoes(slug);
CREATE INDEX idx_competicoes_status ON competicoes(status);

-- Row Level Security
ALTER TABLE equipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE atletas ENABLE ROW LEVEL SECURITY;
ALTER TABLE competicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking ENABLE ROW LEVEL SECURITY;

-- Policies: leitura publica para consultas futuras
CREATE POLICY "Leitura publica de competicoes" ON competicoes FOR SELECT USING (true);
CREATE POLICY "Leitura publica de resultados" ON resultados FOR SELECT USING (true);
CREATE POLICY "Leitura publica de ranking" ON ranking FOR SELECT USING (true);
CREATE POLICY "Leitura publica de atletas" ON atletas FOR SELECT USING (true);
CREATE POLICY "Leitura publica de equipes" ON equipes FOR SELECT USING (true);
