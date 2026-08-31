/*
# Update RLS policies to authenticated-only

Now that the app has a sign-in screen with two user roles (admin and atendente),
all RLS policies must be scoped to TO authenticated only. The previous policies
allowed anon access which is no longer appropriate.

## Changes
- Drop all existing anon+authenticated policies on all 10 tables.
- Recreate each table's 4 CRUD policies (SELECT, INSERT, UPDATE, DELETE) scoped to TO authenticated.
- All authenticated users (admin and atendente) can read/write all CRM data — this is a shared-data app, not per-user isolated data.
- The role distinction (admin vs atendente) is stored in raw_app_meta_data and can be used in the frontend for UI-level permissions, but both roles have full CRUD access to all tables.

## Tables affected (all 10):
1. canais_contato
2. planos
3. leads
4. alunos
5. matriculas
6. mensalidades
7. templates_mensagem
8. regras_automacao
9. comunicacoes
10. tarefas

## Security
- RLS remains enabled on all tables.
- All policies now use TO authenticated (no more anon access).
- USING (true) / WITH CHECK (true) is acceptable here because the data is intentionally shared among all authenticated staff members of the gym — this is not per-user isolated data.
*/

-- 1. canais_contato
DROP POLICY IF EXISTS "anon_crud_canais_select" ON canais_contato;
DROP POLICY IF EXISTS "anon_crud_canais_insert" ON canais_contato;
DROP POLICY IF EXISTS "anon_crud_canais_update" ON canais_contato;
DROP POLICY IF EXISTS "anon_crud_canais_delete" ON canais_contato;

CREATE POLICY "auth_select_canais" ON canais_contato FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_canais" ON canais_contato FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_canais" ON canais_contato FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_canais" ON canais_contato FOR DELETE TO authenticated USING (true);

-- 2. planos
DROP POLICY IF EXISTS "anon_crud_planos_select" ON planos;
DROP POLICY IF EXISTS "anon_crud_planos_insert" ON planos;
DROP POLICY IF EXISTS "anon_crud_planos_update" ON planos;
DROP POLICY IF EXISTS "anon_crud_planos_delete" ON planos;

CREATE POLICY "auth_select_planos" ON planos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_planos" ON planos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_planos" ON planos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_planos" ON planos FOR DELETE TO authenticated USING (true);

-- 3. leads
DROP POLICY IF EXISTS "anon_crud_leads_select" ON leads;
DROP POLICY IF EXISTS "anon_crud_leads_insert" ON leads;
DROP POLICY IF EXISTS "anon_crud_leads_update" ON leads;
DROP POLICY IF EXISTS "anon_crud_leads_delete" ON leads;

CREATE POLICY "auth_select_leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_leads" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_leads" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_leads" ON leads FOR DELETE TO authenticated USING (true);

-- 4. alunos
DROP POLICY IF EXISTS "anon_crud_alunos_select" ON alunos;
DROP POLICY IF EXISTS "anon_crud_alunos_insert" ON alunos;
DROP POLICY IF EXISTS "anon_crud_alunos_update" ON alunos;
DROP POLICY IF EXISTS "anon_crud_alunos_delete" ON alunos;

CREATE POLICY "auth_select_alunos" ON alunos FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_alunos" ON alunos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_alunos" ON alunos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_alunos" ON alunos FOR DELETE TO authenticated USING (true);

-- 5. matriculas
DROP POLICY IF EXISTS "anon_crud_matriculas_select" ON matriculas;
DROP POLICY IF EXISTS "anon_crud_matriculas_insert" ON matriculas;
DROP POLICY IF EXISTS "anon_crud_matriculas_update" ON matriculas;
DROP POLICY IF EXISTS "anon_crud_matriculas_delete" ON matriculas;

CREATE POLICY "auth_select_matriculas" ON matriculas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_matriculas" ON matriculas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_matriculas" ON matriculas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_matriculas" ON matriculas FOR DELETE TO authenticated USING (true);

-- 6. mensalidades
DROP POLICY IF EXISTS "anon_crud_mensalidades_select" ON mensalidades;
DROP POLICY IF EXISTS "anon_crud_mensalidades_insert" ON mensalidades;
DROP POLICY IF EXISTS "anon_crud_mensalidades_update" ON mensalidades;
DROP POLICY IF EXISTS "anon_crud_mensalidades_delete" ON mensalidades;

CREATE POLICY "auth_select_mensalidades" ON mensalidades FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_mensalidades" ON mensalidades FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_mensalidades" ON mensalidades FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_mensalidades" ON mensalidades FOR DELETE TO authenticated USING (true);

-- 7. templates_mensagem
DROP POLICY IF EXISTS "anon_crud_templates_select" ON templates_mensagem;
DROP POLICY IF EXISTS "anon_crud_templates_insert" ON templates_mensagem;
DROP POLICY IF EXISTS "anon_crud_templates_update" ON templates_mensagem;
DROP POLICY IF EXISTS "anon_crud_templates_delete" ON templates_mensagem;

CREATE POLICY "auth_select_templates" ON templates_mensagem FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_templates" ON templates_mensagem FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_templates" ON templates_mensagem FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_templates" ON templates_mensagem FOR DELETE TO authenticated USING (true);

-- 8. regras_automacao
DROP POLICY IF EXISTS "anon_crud_regras_select" ON regras_automacao;
DROP POLICY IF EXISTS "anon_crud_regras_insert" ON regras_automacao;
DROP POLICY IF EXISTS "anon_crud_regras_update" ON regras_automacao;
DROP POLICY IF EXISTS "anon_crud_regras_delete" ON regras_automacao;

CREATE POLICY "auth_select_regras" ON regras_automacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_regras" ON regras_automacao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_regras" ON regras_automacao FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_regras" ON regras_automacao FOR DELETE TO authenticated USING (true);

-- 9. comunicacoes
DROP POLICY IF EXISTS "anon_crud_comunicacoes_select" ON comunicacoes;
DROP POLICY IF EXISTS "anon_crud_comunicacoes_insert" ON comunicacoes;
DROP POLICY IF EXISTS "anon_crud_comunicacoes_update" ON comunicacoes;
DROP POLICY IF EXISTS "anon_crud_comunicacoes_delete" ON comunicacoes;

CREATE POLICY "auth_select_comunicacoes" ON comunicacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_comunicacoes" ON comunicacoes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_comunicacoes" ON comunicacoes FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_comunicacoes" ON comunicacoes FOR DELETE TO authenticated USING (true);

-- 10. tarefas
DROP POLICY IF EXISTS "anon_crud_tarefas_select" ON tarefas;
DROP POLICY IF EXISTS "anon_crud_tarefas_insert" ON tarefas;
DROP POLICY IF EXISTS "anon_crud_tarefas_update" ON tarefas;
DROP POLICY IF EXISTS "anon_crud_tarefas_delete" ON tarefas;

CREATE POLICY "auth_select_tarefas" ON tarefas FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth_insert_tarefas" ON tarefas FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_tarefas" ON tarefas FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_tarefas" ON tarefas FOR DELETE TO authenticated USING (true);
