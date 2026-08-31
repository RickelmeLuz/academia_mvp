import { useEffect, useState, useCallback } from 'react';
import { Plus, UserPlus, Search, ArrowRightLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPhone, formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Lead, LeadStatus, AlunoStatus } from '@/types';

const columns: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'NOVO', label: 'Novo', color: 'border-t-amber-400' },
  { key: 'CONTATADO', label: 'Contatado', color: 'border-t-blue-400' },
  { key: 'VISITOU', label: 'Visitou', color: 'border-t-cyan-400' },
  { key: 'NEGOCIANDO', label: 'Negociando', color: 'border-t-violet-400' },
  { key: 'CONVERTIDO', label: 'Convertido', color: 'border-t-emerald-400' },
  { key: 'PERDIDO', label: 'Perdido', color: 'border-t-gray-400' },
];

export function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [showForm, setShowForm] = useState(false);
  const [convertLead, setConvertLead] = useState<Lead | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('leads').select('*').order('data_cadastro', { ascending: false });
    if (search.trim()) {
      query = query.or(`nome.ilike.%${search.trim()}%,telefone.ilike.%${search.trim()}%,email.ilike.%${search.trim}%`);
    }
    const { data } = await query;
    setLeads(data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(leadId: string, status: LeadStatus) {
    const updates: Partial<Lead> = { status };
    if (status !== 'NOVO') updates.data_ultimo_contato = new Date().toISOString();
    await supabase.from('leads').update(updates).eq('id', leadId);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, status } : l)));
  }

  const filteredByStatus = (status: LeadStatus) => leads.filter((l) => l.status === status);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-1 text-sm text-gray-500">{leads.length} no funil</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Novo Lead
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex rounded-lg bg-gray-100 p-1">
          <button
            onClick={() => setView('kanban')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'kanban' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView('lista')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              view === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            Lista
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : leads.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<UserPlus className="h-12 w-12" />}
            title="Nenhum lead encontrado"
            description="Cadastre um novo lead para começar o funil de vendas."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Novo Lead
              </Button>
            }
          />
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const colLeads = filteredByStatus(col.key);
            return (
              <div key={col.key} className={`w-72 shrink-0 rounded-xl bg-gray-50 ring-1 ring-gray-200 border-t-4 ${col.color}`}>
                <div className="flex items-center justify-between px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-700">{col.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-500 ring-1 ring-gray-200">
                    {colLeads.length}
                  </span>
                </div>
                <div className="space-y-2 px-2 pb-3">
                  {colLeads.map((lead) => (
                    <div key={lead.id} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-gray-200">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-medium text-gray-900">{lead.nome}</p>
                        {col.key !== 'CONVERTIDO' && col.key !== 'PERDIDO' && (
                          <button
                            onClick={() => setConvertLead(lead)}
                            className="text-gray-400 hover:text-emerald-600 transition-colors"
                            title="Converter em aluno"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      {lead.telefone && (
                        <p className="mt-1 text-xs text-gray-500">{formatPhone(lead.telefone)}</p>
                      )}
                      {lead.interesse && (
                        <p className="mt-1 text-xs text-gray-400">Interesse: {lead.interesse}</p>
                      )}
                      {lead.origem && (
                        <p className="mt-1 text-xs text-gray-400">Origem: {lead.origem}</p>
                      )}
                      {col.key !== 'CONVERTIDO' && col.key !== 'PERDIDO' && (
                        <select
                          value={lead.status}
                          onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                          className="mt-2 w-full rounded-md border-0 bg-gray-50 px-2 py-1.5 text-xs text-gray-600 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-blue-600"
                        >
                          {columns.map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                  {colLeads.length === 0 && (
                    <p className="py-4 text-center text-xs text-gray-400">Vazio</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Nome</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 sm:table-cell">Telefone</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 md:table-cell">Origem</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 lg:table-cell">Cadastro</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{lead.nome}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">{formatPhone(lead.telefone)}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 md:table-cell">{lead.origem ?? '—'}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 lg:table-cell">{formatDate(lead.data_cadastro)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={lead.status === 'CONVERTIDO' ? 'green' : lead.status === 'PERDIDO' ? 'gray' : lead.status === 'NOVO' ? 'yellow' : lead.status === 'NEGOCIANDO' ? 'purple' : 'blue'}>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {lead.status !== 'CONVERTIDO' && lead.status !== 'PERDIDO' && (
                      <Button variant="success" size="sm" onClick={() => setConvertLead(lead)}>
                        Converter
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <LeadForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {convertLead && (
        <ConvertModal
          lead={convertLead}
          onClose={() => setConvertLead(null)}
          onConverted={() => {
            setConvertLead(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function LeadForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    origem: '',
    interesse: '',
    observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    const { error: insertError } = await supabase.from('leads').insert({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      origem: form.origem.trim() || null,
      interesse: form.interesse.trim() || null,
      observacoes: form.observacoes.trim() || null,
      status: 'NOVO',
    });
    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Novo Lead" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do lead" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Origem">
            <Input value={form.origem} onChange={(e) => setForm({ ...form, origem: e.target.value })} placeholder="Instagram, indicação, site..." />
          </Field>
          <Field label="Interesse">
            <Input value={form.interesse} onChange={(e) => setForm({ ...form, interesse: e.target.value })} placeholder="Musculação, funcional..." />
          </Field>
        </div>
        <Field label="Observações">
          <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
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

function ConvertModal({
  lead,
  onClose,
  onConverted,
}: {
  lead: Lead;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [form, setForm] = useState({
    cpf: '',
    data_nascimento: '',
    status: 'ATIVO' as AlunoStatus,
  observacoes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Step 1: Create the aluno with lead_origem_id
    const { data: alunoData, error: alunoError } = await supabase
      .from('alunos')
      .insert({
        nome: lead.nome,
        cpf: form.cpf.replace(/\D/g, '') || null,
        telefone: lead.telefone,
        email: lead.email,
        data_nascimento: form.data_nascimento || null,
        status: form.status,
        observacoes: form.observacoes.trim() || null,
        lead_origem_id: lead.id,
      })
      .select()
      .single();

    if (alunoError) {
      if (alunoError.message.includes('cpf')) {
        setError('Já existe um aluno com este CPF.');
      } else {
        setError(alunoError.message);
      }
      setSaving(false);
      return;
    }

    // Step 2: Update lead with CONVERTIDO status and aluno_convertido_id
    const { error: leadError } = await supabase
      .from('leads')
      .update({
        status: 'CONVERTIDO',
        aluno_convertido_id: alunoData.id,
        data_ultimo_contato: new Date().toISOString(),
      })
      .eq('id', lead.id);

    if (leadError) {
      setError('Aluno criado, mas erro ao atualizar lead: ' + leadError.message);
      setSaving(false);
      return;
    }

    onConverted();
  }

  return (
    <Modal open onClose={onClose} title={`Converter ${lead.nome} em Aluno`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
          Os dados de nome, telefone e email do lead serão copiados para o aluno. Preencha os campos abaixo.
        </div>
        <Field label="CPF">
          <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} placeholder="000.000.000-00" />
        </Field>
        <Field label="Data de Nascimento">
          <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
        </Field>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AlunoStatus })}>
            <option value="ATIVO">ATIVO</option>
            <option value="INATIVO">INATIVO</option>
          </Select>
        </Field>
        <Field label="Observações">
          <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="success" disabled={saving}>
            {saving ? 'Convertendo...' : 'Converter em Aluno'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
