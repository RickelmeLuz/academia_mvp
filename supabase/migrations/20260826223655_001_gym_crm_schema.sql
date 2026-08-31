/*
# Gym CRM + Communication System - Initial Schema

Creates the complete data model for a gym CRM with leads, students, plans,
enrollments, monthly fees, message templates, automation rules, communication
logs, and tasks.

## New Tables (10)

1. canais_contato — Contact channels (WhatsApp, SMS, Email)
   - id (uuid PK), nome (text unique), ativo (bool), data_criacao (timestamptz)

2. planos — Membership plans
   - id (uuid PK), nome (text), valor (numeric), duracao_meses (int),
     ativo (bool), data_criacao (timestamptz)

3. alunos — Students
   - id (uuid PK), nome (text), cpf (text unique), telefone, email,
     data_nascimento (date), data_cadastro (timestamptz),
     status (enum: ATIVO|INATIVO|CANCELADO), observacoes (text),
     lead_origem_id (FK -> leads, nullable), data_atualizacao (timestamptz)

4. leads — Sales leads
   - id (uuid PK), nome, telefone, email, origem (text), interesse (text),
     status (enum: NOVO|CONTATADO|VISITOU|NEGOCIANDO|CONVERTIDO|PERDIDO),
     data_cadastro (timestamptz), data_ultimo_contato (timestamptz),
     observacoes (text), aluno_convertido_id (FK -> alunos, nullable)

5. matriculas — Enrollments
   - id (uuid PK), aluno_id (FK -> alunos), plano_id (FK -> planos),
     valor_contratado (numeric), data_inicio (date), data_termino (date),
     status (enum: ATIVA|INADIMPLENTE|SUSPENSA|CANCELADA|ENCERRADA),
     data_criacao, data_atualizacao

6. mensalidades — Monthly fees/installments
   - id (uuid PK), matricula_id (FK -> matriculas),
     numero_parcela (int), total_parcelas (int),
     valor (numeric), valor_pago (numeric), data_vencimento (date),
     data_pagamento (date), forma_pagamento (enum: PIX|CARTAO|DINHEIRO|BOLETO),
     status (enum: PENDENTE|PAGO|ATRASADO|CANCELADO), observacoes (text),
     data_criacao (timestamptz)

7. templates_mensagem — Message templates with variables
   - id (uuid PK), nome (text), categoria (enum), canal_id (FK -> canais_contato),
     assunto (text), corpo_mensagem (text), ativo (bool),
     data_criacao, data_atualizacao

8. regras_automacao — Automation rules
   - id (uuid PK), nome (text), evento_gatilho (enum), dias_referencia (int),
     template_id (FK -> templates_mensagem), canal_id (FK -> canais_contato),
     ativo (bool), data_criacao (timestamptz)

9. comunicacoes — Communication log
   - id (uuid PK), lead_id (FK nullable), aluno_id (FK nullable),
     matricula_id (FK nullable), mensalidade_id (FK nullable),
     canal_id (FK -> canais_contato), template_id (FK nullable),
     regra_automacao_id (FK nullable), assunto (text),
     mensagem_enviada (text), status (enum: AGENDADA|ENVIADA|FALHOU|LIDA|RESPONDIDA|CANCELADA),
     data_agendamento, data_envio, data_leitura, resposta (text),
     data_resposta, erro_envio (text), data_criacao (timestamptz)

10. tarefas — Tasks
    - id (uuid PK), lead_id (FK nullable), aluno_id (FK nullable),
      titulo (text), descricao (text), data_vencimento (date),
      prioridade (enum: BAIXA|MEDIA|ALTA),
      status (enum: PENDENTE|CONCLUIDA|CANCELADA),
      data_conclusao (timestamptz), data_criacao (timestamptz)

## Security
- RLS enabled on ALL tables.
- All policies use TO anon, authenticated (no-auth single-tenant app — no sign-in screen).
- Full CRUD allowed for anon + authenticated on every table (data is intentionally shared).

## Notes
1. Enum types are created with DO blocks for idempotency.
2. Foreign keys use ON DELETE CASCADE for child tables to avoid orphans.
3. The leads/alunos circular reference: lead_origem_id added after both tables exist.
4. Indexes on frequently-filtered columns (status, cpf, data_vencimento).
*/

-- ============================================================
-- ENUM TYPES
-- ============================================================
DO $$ BEGIN
  CREATE TYPE aluno_status AS ENUM ('ATIVO', 'INATIVO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('NOVO', 'CONTATADO', 'VISITOU', 'NEGOCIANDO', 'CONVERTIDO', 'PERDIDO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE matricula_status AS ENUM ('ATIVA', 'INADIMPLENTE', 'SUSPENSA', 'CANCELADA', 'ENCERRADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE mensalidade_status AS ENUM ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE forma_pagamento AS ENUM ('PIX', 'CARTAO', 'DINHEIRO', 'BOLETO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE template_categoria AS ENUM ('COBRANCA', 'VENCIMENTO_PROXIMO', 'ATRASO', 'BOAS_VINDAS', 'RENOVACAO', 'RECUPERACAO', 'PRIMEIRO_CONTATO_LEAD', 'PROMOCAO', 'OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE evento_gatilho AS ENUM ('VENCIMENTO_PROXIMO', 'PAGAMENTO_ATRASADO', 'MATRICULA_A_VENCER', 'AUSENCIA_PROLONGADA', 'NOVO_LEAD', 'BOAS_VINDAS');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE comunicacao_status AS ENUM ('AGENDADA', 'ENVIADA', 'FALHOU', 'LIDA', 'RESPONDIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tarefa_prioridade AS ENUM ('BAIXA', 'MEDIA', 'ALTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE tarefa_status AS ENUM ('PENDENTE', 'CONCLUIDA', 'CANCELADA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. canais_contato
-- ============================================================
CREATE TABLE IF NOT EXISTS canais_contato (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE canais_contato ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_canais_select" ON canais_contato;
CREATE POLICY "anon_crud_canais_select" ON canais_contato FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_canais_insert" ON canais_contato;
CREATE POLICY "anon_crud_canais_insert" ON canais_contato FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_canais_update" ON canais_contato;
CREATE POLICY "anon_crud_canais_update" ON canais_contato FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_canais_delete" ON canais_contato;
CREATE POLICY "anon_crud_canais_delete" ON canais_contato FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 2. planos
-- ============================================================
CREATE TABLE IF NOT EXISTS planos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  duracao_meses integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE planos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_planos_select" ON planos;
CREATE POLICY "anon_crud_planos_select" ON planos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_planos_insert" ON planos;
CREATE POLICY "anon_crud_planos_insert" ON planos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_planos_update" ON planos;
CREATE POLICY "anon_crud_planos_update" ON planos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_planos_delete" ON planos;
CREATE POLICY "anon_crud_planos_delete" ON planos FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 3. leads  (created before alunos so FK can reference)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  origem text,
  interesse text,
  status lead_status NOT NULL DEFAULT 'NOVO',
  data_cadastro timestamptz NOT NULL DEFAULT now(),
  data_ultimo_contato timestamptz,
  observacoes text,
  aluno_convertido_id uuid  -- FK added after alunos table
);
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_leads_select" ON leads;
CREATE POLICY "anon_crud_leads_select" ON leads FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_leads_insert" ON leads;
CREATE POLICY "anon_crud_leads_insert" ON leads FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_leads_update" ON leads;
CREATE POLICY "anon_crud_leads_update" ON leads FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_leads_delete" ON leads;
CREATE POLICY "anon_crud_leads_delete" ON leads FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- ============================================================
-- 4. alunos
-- ============================================================
CREATE TABLE IF NOT EXISTS alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cpf text UNIQUE,
  telefone text,
  email text,
  data_nascimento date,
  data_cadastro timestamptz NOT NULL DEFAULT now(),
  status aluno_status NOT NULL DEFAULT 'ATIVO',
  observacoes text,
  lead_origem_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  data_atualizacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE alunos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_alunos_select" ON alunos;
CREATE POLICY "anon_crud_alunos_select" ON alunos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_alunos_insert" ON alunos;
CREATE POLICY "anon_crud_alunos_insert" ON alunos FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_alunos_update" ON alunos;
CREATE POLICY "anon_crud_alunos_update" ON alunos FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_alunos_delete" ON alunos;
CREATE POLICY "anon_crud_alunos_delete" ON alunos FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_alunos_status ON alunos(status);
CREATE INDEX IF NOT EXISTS idx_alunos_cpf ON alunos(cpf);

-- Now add the reverse FK from leads -> alunos
DO $$ BEGIN
  ALTER TABLE leads
    ADD CONSTRAINT leads_aluno_convertido_fk
    FOREIGN KEY (aluno_convertido_id) REFERENCES alunos(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 5. matriculas
-- ============================================================
CREATE TABLE IF NOT EXISTS matriculas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id uuid NOT NULL REFERENCES alunos(id) ON DELETE CASCADE,
  plano_id uuid NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,
  valor_contratado numeric(10,2) NOT NULL DEFAULT 0,
  data_inicio date NOT NULL DEFAULT CURRENT_DATE,
  data_termino date,
  status matricula_status NOT NULL DEFAULT 'ATIVA',
  data_criacao timestamptz NOT NULL DEFAULT now(),
  data_atualizacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE matriculas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_matriculas_select" ON matriculas;
CREATE POLICY "anon_crud_matriculas_select" ON matriculas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_matriculas_insert" ON matriculas;
CREATE POLICY "anon_crud_matriculas_insert" ON matriculas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_matriculas_update" ON matriculas;
CREATE POLICY "anon_crud_matriculas_update" ON matriculas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_matriculas_delete" ON matriculas;
CREATE POLICY "anon_crud_matriculas_delete" ON matriculas FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_matriculas_aluno ON matriculas(aluno_id);
CREATE INDEX IF NOT EXISTS idx_matriculas_status ON matriculas(status);

-- ============================================================
-- 6. mensalidades
-- ============================================================
CREATE TABLE IF NOT EXISTS mensalidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id uuid NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
  numero_parcela integer NOT NULL,
  total_parcelas integer NOT NULL,
  valor numeric(10,2) NOT NULL DEFAULT 0,
  valor_pago numeric(10,2),
  data_vencimento date NOT NULL,
  data_pagamento date,
  forma_pagamento forma_pagamento,
  status mensalidade_status NOT NULL DEFAULT 'PENDENTE',
  observacoes text,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE mensalidades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_mensalidades_select" ON mensalidades;
CREATE POLICY "anon_crud_mensalidades_select" ON mensalidades FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_mensalidades_insert" ON mensalidades;
CREATE POLICY "anon_crud_mensalidades_insert" ON mensalidades FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_mensalidades_update" ON mensalidades;
CREATE POLICY "anon_crud_mensalidades_update" ON mensalidades FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_mensalidades_delete" ON mensalidades;
CREATE POLICY "anon_crud_mensalidades_delete" ON mensalidades FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_mensalidades_matricula ON mensalidades(matricula_id);
CREATE INDEX IF NOT EXISTS idx_mensalidades_status ON mensalidades(status);
CREATE INDEX IF NOT EXISTS idx_mensalidades_vencimento ON mensalidades(data_vencimento);

-- ============================================================
-- 7. templates_mensagem
-- ============================================================
CREATE TABLE IF NOT EXISTS templates_mensagem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria template_categoria NOT NULL DEFAULT 'OUTRO',
  canal_id uuid REFERENCES canais_contato(id) ON DELETE SET NULL,
  assunto text,
  corpo_mensagem text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  data_criacao timestamptz NOT NULL DEFAULT now(),
  data_atualizacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE templates_mensagem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_templates_select" ON templates_mensagem;
CREATE POLICY "anon_crud_templates_select" ON templates_mensagem FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_templates_insert" ON templates_mensagem;
CREATE POLICY "anon_crud_templates_insert" ON templates_mensagem FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_templates_update" ON templates_mensagem;
CREATE POLICY "anon_crud_templates_update" ON templates_mensagem FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_templates_delete" ON templates_mensagem;
CREATE POLICY "anon_crud_templates_delete" ON templates_mensagem FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 8. regras_automacao
-- ============================================================
CREATE TABLE IF NOT EXISTS regras_automacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  evento_gatilho evento_gatilho NOT NULL,
  dias_referencia integer NOT NULL DEFAULT 0,
  template_id uuid REFERENCES templates_mensagem(id) ON DELETE SET NULL,
  canal_id uuid REFERENCES canais_contato(id) ON DELETE SET NULL,
  ativo boolean NOT NULL DEFAULT true,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE regras_automacao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_regras_select" ON regras_automacao;
CREATE POLICY "anon_crud_regras_select" ON regras_automacao FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_regras_insert" ON regras_automacao;
CREATE POLICY "anon_crud_regras_insert" ON regras_automacao FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_regras_update" ON regras_automacao;
CREATE POLICY "anon_crud_regras_update" ON regras_automacao FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_regras_delete" ON regras_automacao;
CREATE POLICY "anon_crud_regras_delete" ON regras_automacao FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- 9. comunicacoes
-- ============================================================
CREATE TABLE IF NOT EXISTS comunicacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  aluno_id uuid REFERENCES alunos(id) ON DELETE SET NULL,
  matricula_id uuid REFERENCES matriculas(id) ON DELETE SET NULL,
  mensalidade_id uuid REFERENCES mensalidades(id) ON DELETE SET NULL,
  canal_id uuid REFERENCES canais_contato(id) ON DELETE SET NULL,
  template_id uuid REFERENCES templates_mensagem(id) ON DELETE SET NULL,
  regra_automacao_id uuid REFERENCES regras_automacao(id) ON DELETE SET NULL,
  assunto text,
  mensagem_enviada text,
  status comunicacao_status NOT NULL DEFAULT 'AGENDADA',
  data_agendamento timestamptz,
  data_envio timestamptz,
  data_leitura timestamptz,
  resposta text,
  data_resposta timestamptz,
  erro_envio text,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE comunicacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_comunicacoes_select" ON comunicacoes;
CREATE POLICY "anon_crud_comunicacoes_select" ON comunicacoes FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_comunicacoes_insert" ON comunicacoes;
CREATE POLICY "anon_crud_comunicacoes_insert" ON comunicacoes FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_comunicacoes_update" ON comunicacoes;
CREATE POLICY "anon_crud_comunicacoes_update" ON comunicacoes FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_comunicacoes_delete" ON comunicacoes;
CREATE POLICY "anon_crud_comunicacoes_delete" ON comunicacoes FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_aluno ON comunicacoes(aluno_id);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_lead ON comunicacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_comunicacoes_status ON comunicacoes(status);

-- ============================================================
-- 10. tarefas
-- ============================================================
CREATE TABLE IF NOT EXISTS tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  aluno_id uuid REFERENCES alunos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  data_vencimento date,
  prioridade tarefa_prioridade NOT NULL DEFAULT 'MEDIA',
  status tarefa_status NOT NULL DEFAULT 'PENDENTE',
  data_conclusao timestamptz,
  data_criacao timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_tarefas_select" ON tarefas;
CREATE POLICY "anon_crud_tarefas_select" ON tarefas FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_tarefas_insert" ON tarefas;
CREATE POLICY "anon_crud_tarefas_insert" ON tarefas FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_tarefas_update" ON tarefas;
CREATE POLICY "anon_crud_tarefas_update" ON tarefas FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_tarefas_delete" ON tarefas;
CREATE POLICY "anon_crud_tarefas_delete" ON tarefas FOR DELETE TO anon, authenticated USING (true);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_vencimento ON tarefas(data_vencimento);

-- ============================================================
-- SEED DATA: contact channels
-- ============================================================
INSERT INTO canais_contato (nome, ativo)
VALUES ('WHATSAPP', true), ('SMS', true), ('EMAIL', true)
ON CONFLICT (nome) DO NOTHING;

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_data_atualizacao()
RETURNS trigger AS $$
BEGIN
  NEW.data_atualizacao = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_alunos_updated ON alunos;
CREATE TRIGGER trg_alunos_updated BEFORE UPDATE ON alunos
  FOR EACH ROW EXECUTE FUNCTION update_data_atualizacao();

DROP TRIGGER IF EXISTS trg_matriculas_updated ON matriculas;
CREATE TRIGGER trg_matriculas_updated BEFORE UPDATE ON matriculas
  FOR EACH ROW EXECUTE FUNCTION update_data_atualizacao();

DROP TRIGGER IF EXISTS trg_templates_updated ON templates_mensagem;
CREATE TRIGGER trg_templates_updated BEFORE UPDATE ON templates_mensagem
  FOR EACH ROW EXECUTE FUNCTION update_data_atualizacao();
