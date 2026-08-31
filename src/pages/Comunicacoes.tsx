import { useEffect, useState, useCallback } from 'react';
import { Plus, Send, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDateTime } from '@/lib/format';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Comunicacao, ComunicacaoStatus, CanalContato, TemplateMensagem, Aluno, Lead } from '@/types';

const statusOptions: ('TODOS' | ComunicacaoStatus)[] = ['TODOS', 'AGENDADA', 'ENVIADA', 'FALHOU', 'LIDA', 'RESPONDIDA', 'CANCELADA'];

export function Comunicacoes() {
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | ComunicacaoStatus>('TODOS');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('comunicacoes')
      .select('*, canal:canais_contato(*), aluno:alunos(nome), lead:leads(nome), template:templates_mensagem(nome)')
      .order('data_criacao', { ascending: false });
    if (statusFilter !== 'TODOS') query = query.eq('status', statusFilter);
    const { data } = await query;
    let result = (data ?? []) as Comunicacao[];
    if (search.trim()) {
      result = result.filter((c) =>
        (c.assunto ?? '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (c.mensagem_enviada ?? '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (c.aluno?.nome ?? '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (c.lead?.nome ?? '').toLowerCase().includes(search.trim().toLowerCase())
      );
    }
    setComunicacoes(result);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Comunicações</h1>
          <p className="mt-1 text-sm text-gray-500">Histórico de mensagens enviadas</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Registrar Envio Manual
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por assunto, mensagem, aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | ComunicacaoStatus)} className="sm:w-48">
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos os status' : s}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <PageLoader />
      ) : comunicacoes.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<Send className="h-12 w-12" />}
            title="Nenhuma comunicação registrada"
            description="Registre envios manuais de mensagens ou aguarde as automações."
            action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Registrar Envio</Button>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {comunicacoes.map((c) => (
            <div key={c.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                    <Send className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{c.assunto ?? 'Sem assunto'}</p>
                      <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 line-clamp-2">{c.mensagem_enviada}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span>Para: {c.aluno?.nome ?? c.lead?.nome ?? '—'}</span>
                      <span>• Canal: {c.canal?.nome ?? '—'}</span>
                      {c.template && <span>• Template: {c.template.nome}</span>}
                      <span>• {formatDateTime(c.data_envio ?? c.data_criacao)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {c.resposta && (
                <div className="mt-3 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-semibold text-gray-500">Resposta recebida:</p>
                  <p className="mt-1 text-sm text-gray-700">{c.resposta}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ComunicacaoForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function ComunicacaoForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [canais, setCanais] = useState<CanalContato[]>([]);
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [destinatarioType, setDestinatarioType] = useState<'aluno' | 'lead'>('aluno');
  const [form, setForm] = useState({
    aluno_id: '',
    lead_id: '',
    canal_id: '',
    template_id: '',
    assunto: '',
    mensagem: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      supabase.from('canais_contato').select('*').eq('ativo', true).order('nome'),
      supabase.from('templates_mensagem').select('*').eq('ativo', true).order('nome'),
      supabase.from('alunos').select('*').order('nome'),
      supabase.from('leads').select('*').order('nome'),
    ]).then(([cRes, tRes, aRes, lRes]) => {
      setCanais((cRes.data ?? []) as CanalContato[]);
      setTemplates((tRes.data ?? []) as TemplateMensagem[]);
      setAlunos((aRes.data ?? []) as Aluno[]);
      setLeads((lRes.data ?? []) as Lead[]);
    });
  }, []);

  function applyTemplate(templateId: string) {
    const t = templates.find((x) => x.id === templateId);
    if (t) {
      setForm((prev) => ({ ...prev, template_id: templateId, assunto: t.assunto ?? '', mensagem: t.corpo_mensagem }));
    } else {
      setForm((prev) => ({ ...prev, template_id: '' }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const alunoId = destinatarioType === 'aluno' ? form.aluno_id : null;
    const leadId = destinatarioType === 'lead' ? form.lead_id : null;

    if (!alunoId && !leadId) {
      setError('A comunicação deve estar ligada a um aluno OU um lead.');
      return;
    }
    if (!form.mensagem.trim()) {
      setError('A mensagem é obrigatória.');
      return;
    }

    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('comunicacoes').insert({
      aluno_id: alunoId,
      lead_id: leadId,
      canal_id: form.canal_id || null,
      template_id: form.template_id || null,
      assunto: form.assunto.trim() || null,
      mensagem_enviada: form.mensagem,
      status: 'ENVIADA',
      data_envio: new Date().toISOString(),
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Registrar Envio Manual" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setDestinatarioType('aluno')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              destinatarioType === 'aluno' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Para Aluno
          </button>
          <button
            type="button"
            onClick={() => setDestinatarioType('lead')}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              destinatarioType === 'lead' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Para Lead
          </button>
        </div>

        {destinatarioType === 'aluno' ? (
          <Field label="Aluno *">
            <Select value={form.aluno_id} onChange={(e) => setForm({ ...form, aluno_id: e.target.value })}>
              <option value="">Selecione um aluno...</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </Select>
          </Field>
        ) : (
          <Field label="Lead *">
            <Select value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>
              <option value="">Selecione um lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </Select>
          </Field>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Canal">
            <Select value={form.canal_id} onChange={(e) => setForm({ ...form, canal_id: e.target.value })}>
              <option value="">Nenhum</option>
              {canais.map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </Select>
          </Field>
          <Field label="Template (opcional)">
            <Select value={form.template_id} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">Nenhum</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.nome}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Assunto">
          <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} placeholder="Assunto da mensagem" />
        </Field>
        <Field label="Mensagem *">
          <Textarea
            value={form.mensagem}
            onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
            rows={5}
            placeholder="Conteúdo da mensagem enviada"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Registrando...' : 'Registrar Envio'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
