import { useEffect, useState, useCallback } from 'react';
import { Plus, Workflow, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { RegraAutomacao, EventoGatilho, TemplateMensagem, CanalContato } from '@/types';

const eventos: EventoGatilho[] = [
  'VENCIMENTO_PROXIMO', 'PAGAMENTO_ATRASADO', 'MATRICULA_A_VENCER',
  'AUSENCIA_PROLONGADA', 'NOVO_LEAD', 'BOAS_VINDAS',
];

export function Regras() {
  const [regras, setRegras] = useState<RegraAutomacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RegraAutomacao | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('regras_automacao')
      .select('*, template:templates_mensagem(*), canal:canais_contato(*)')
      .order('data_criacao', { ascending: false });
    setRegras((data ?? []) as RegraAutomacao[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAtivo(regra: RegraAutomacao) {
    await supabase.from('regras_automacao').update({ ativo: !regra.ativo }).eq('id', regra.id);
    setRegras((prev) => prev.map((r) => (r.id === regra.id ? { ...r, ativo: !r.ativo } : r)));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regras de Automação</h1>
          <p className="mt-1 text-sm text-gray-500">{regras.length} regras cadastradas</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Nova Regra
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : regras.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<Workflow className="h-12 w-12" />}
            title="Nenhuma regra de automação"
            description="Cadastre regras que disparam mensagens automaticamente com base em eventos."
            action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Nova Regra</Button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {regras.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                  <Workflow className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{r.nome}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                    <Badge variant="blue">{r.evento_gatilho}</Badge>
                    <span>• {r.dias_referencia} dias de referência</span>
                    {r.template && <span>• Template: {r.template.nome}</span>}
                    {r.canal && <span>• Canal: {r.canal.nome}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={r.ativo ? 'green' : 'gray'}>{r.ativo ? 'Ativa' : 'Inativa'}</Badge>
                <Button variant="ghost" size="sm" onClick={() => toggleAtivo(r)}>
                  {r.ativo ? 'Desativar' : 'Ativar'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(r); setShowForm(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RegraForm
          regra={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function RegraForm({
  regra,
  onClose,
  onSaved,
}: {
  regra: RegraAutomacao | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [canais, setCanais] = useState<CanalContato[]>([]);
  const [form, setForm] = useState({
    nome: regra?.nome ?? '',
    evento_gatilho: regra?.evento_gatilho ?? 'VENCIMENTO_PROXIMO' as EventoGatilho,
    dias_referencia: regra?.dias_referencia?.toString() ?? '3',
    template_id: regra?.template_id ?? '',
    canal_id: regra?.canal_id ?? '',
    ativo: regra?.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('templates_mensagem').select('*').eq('ativo', true).order('nome'),
      supabase.from('canais_contato').select('*').eq('ativo', true).order('nome'),
    ]).then(([tRes, cRes]) => {
      setTemplates((tRes.data ?? []) as TemplateMensagem[]);
      setCanais((cRes.data ?? []) as CanalContato[]);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      nome: form.nome.trim(),
      evento_gatilho: form.evento_gatilho,
      dias_referencia: parseInt(form.dias_referencia) || 0,
      template_id: form.template_id || null,
      canal_id: form.canal_id || null,
      ativo: form.ativo,
    };

    if (regra) {
      const { error: updateError } = await supabase.from('regras_automacao').update(payload).eq('id', regra.id);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
    } else {
      const { error: insertError } = await supabase.from('regras_automacao').insert(payload);
      if (insertError) { setError(insertError.message); setSaving(false); return; }
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={regra ? 'Editar Regra' : 'Nova Regra'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome da regra" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Evento Gatilho">
            <Select value={form.evento_gatilho} onChange={(e) => setForm({ ...form, evento_gatilho: e.target.value as EventoGatilho })}>
              {eventos.map((ev) => (
                <option key={ev} value={ev}>{ev}</option>
              ))}
            </Select>
          </Field>
          <Field label="Dias de Referência">
            <Input type="number" value={form.dias_referencia} onChange={(e) => setForm({ ...form, dias_referencia: e.target.value })} placeholder="Ex: 3 dias antes do vencimento" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Template">
            <Select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })}>
              <option value="">Nenhum</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Canal">
            <Select value={form.canal_id} onChange={(e) => setForm({ ...form, canal_id: e.target.value })}>
              <option value="">Nenhum</option>
              {canais.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Status">
          <Select value={form.ativo ? 'true' : 'false'} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'true' })}>
            <option value="true">Ativa</option>
            <option value="false">Inativa</option>
          </Select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
