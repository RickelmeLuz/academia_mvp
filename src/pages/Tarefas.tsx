import { useEffect, useState, useCallback } from 'react';
import { Plus, ListTodo, CheckCircle2, Circle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/format';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Tarefa, TarefaStatus, TarefaPrioridade } from '@/types';

const statusOptions: ('TODOS' | TarefaStatus)[] = ['TODOS', 'PENDENTE', 'CONCLUIDA', 'CANCELADA'];
const prioridadeOptions: ('TODOS' | TarefaPrioridade)[] = ['TODOS', 'ALTA', 'MEDIA', 'BAIXA'];

export function Tarefas() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'TODOS' | TarefaStatus>('TODOS');
  const [prioridadeFilter, setPrioridadeFilter] = useState<'TODOS' | TarefaPrioridade>('TODOS');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('tarefas')
      .select('*, aluno:alunos(nome), lead:leads(nome)')
      .order('data_vencimento', { ascending: true });
    if (statusFilter !== 'TODOS') query = query.eq('status', statusFilter);
    if (prioridadeFilter !== 'TODOS') query = query.eq('prioridade', prioridadeFilter);
    const { data } = await query;
    setTarefas((data ?? []) as Tarefa[]);
    setLoading(false);
  }, [statusFilter, prioridadeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleConcluida(tarefa: Tarefa) {
    const newStatus = tarefa.status === 'CONCLUIDA' ? 'PENDENTE' : 'CONCLUIDA';
    const updates: Partial<Tarefa> = {
      status: newStatus,
      data_conclusao: newStatus === 'CONCLUIDA' ? new Date().toISOString() : null,
    };
    await supabase.from('tarefas').update(updates).eq('id', tarefa.id);
    setTarefas((prev) =>
      prev.map((t) => (t.id === tarefa.id ? { ...t, ...updates } as Tarefa : t))
    );
  }

  const pendentes = tarefas.filter((t) => t.status === 'PENDENTE');
  const concluidas = tarefas.filter((t) => t.status === 'CONCLUIDA');

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pendentes.length} pendentes • {concluidas.length} concluídas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | TarefaStatus)} className="sm:w-48">
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos os status' : s}</option>
          ))}
        </Select>
        <Select value={prioridadeFilter} onChange={(e) => setPrioridadeFilter(e.target.value as 'TODOS' | TarefaPrioridade)} className="sm:w-48">
          {prioridadeOptions.map((p) => (
            <option key={p} value={p}>{p === 'TODOS' ? 'Todas as prioridades' : p}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <PageLoader />
      ) : tarefas.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<ListTodo className="h-12 w-12" />}
            title="Nenhuma tarefa encontrada"
            description="Crie tarefas de acompanhamento comercial para não perder prazos."
            action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Nova Tarefa</Button>}
          />
        </div>
      ) : (
        <div className="space-y-2">
          {tarefas.map((t) => {
            const isDone = t.status === 'CONCLUIDA';
            const isOverdue = t.status === 'PENDENTE' && t.data_vencimento && new Date(t.data_vencimento) < new Date(new Date().toDateString());
            return (
              <div
                key={t.id}
                className={`flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 ${
                  isOverdue ? 'ring-red-200' : ''
                }`}
              >
                <button
                  onClick={() => toggleConcluida(t)}
                  className="mt-0.5 shrink-0 transition-colors"
                  disabled={t.status === 'CANCELADA'}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className={`h-5 w-5 ${isOverdue ? 'text-red-400' : 'text-gray-300 hover:text-blue-500'}`} />
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                      {t.titulo}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={statusBadgeVariant(t.prioridade)}>{t.prioridade}</Badge>
                      <Badge variant={statusBadgeVariant(t.status)}>{t.status}</Badge>
                    </div>
                  </div>
                  {t.descricao && (
                    <p className={`mt-1 text-sm ${isDone ? 'text-gray-300' : 'text-gray-500'}`}>{t.descricao}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                    {t.data_vencimento && (
                      <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                        Vence: {formatDate(t.data_vencimento)}
                      </span>
                    )}
                    {t.aluno && <span>Aluno: {t.aluno.nome}</span>}
                    {t.lead && <span>Lead: {t.lead.nome}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <TarefaForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function TarefaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    data_vencimento: new Date().toISOString().split('T')[0],
    prioridade: 'MEDIA' as TarefaPrioridade,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) {
      setError('Título é obrigatório.');
      return;
    }
    setSaving(true);
    setError('');

    const { error: insertError } = await supabase.from('tarefas').insert({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || null,
      data_vencimento: form.data_vencimento || null,
      prioridade: form.prioridade,
      status: 'PENDENTE',
    });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nova Tarefa">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título *">
          <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="O que precisa ser feito?" />
        </Field>
        <Field label="Descrição">
          <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data de Vencimento">
            <Input type="date" value={form.data_vencimento} onChange={(e) => setForm({ ...form, data_vencimento: e.target.value })} />
          </Field>
          <Field label="Prioridade">
            <Select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as TarefaPrioridade })}>
              <option value="BAIXA">BAIXA</option>
              <option value="MEDIA">MEDIA</option>
              <option value="ALTA">ALTA</option>
            </Select>
          </Field>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button>
        </div>
      </form>
    </Modal>
  );
}
