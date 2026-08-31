import { useEffect, useState, useCallback } from 'react';
import { Plus, FileText, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Matricula, MatriculaStatus, Aluno, Plano } from '@/types';

const statusOptions: ('TODOS' | MatriculaStatus)[] = ['TODOS', 'ATIVA', 'INADIMPLENTE', 'SUSPENSA', 'CANCELADA', 'ENCERRADA'];

export function Matriculas() {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | MatriculaStatus>('TODOS');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('matriculas')
      .select('*, aluno:alunos(*), plano:planos(*)')
      .order('data_criacao', { ascending: false });
    if (statusFilter !== 'TODOS') query = query.eq('status', statusFilter);
    const { data } = await query;
    let result = (data ?? []) as Matricula[];
    if (search.trim()) {
      result = result.filter((m) => m.aluno?.nome?.toLowerCase().includes(search.trim().toLowerCase()));
    }
    setMatriculas(result);
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matrículas</h1>
          <p className="mt-1 text-sm text-gray-500">{matriculas.length} matrículas</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Nova Matrícula
        </Button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | MatriculaStatus)}
          className="sm:w-48"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos os status' : s}</option>
          ))}
        </Select>
      </div>

      {loading ? (
        <PageLoader />
      ) : matriculas.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<FileText className="h-12 w-12" />}
            title="Nenhuma matrícula encontrada"
            description="Crie uma matrícula vinculando um aluno a um plano."
            action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Nova Matrícula</Button>}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Aluno</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 sm:table-cell">Plano</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 md:table-cell">Valor</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 lg:table-cell">Período</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matriculas.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.aluno?.nome ?? '—'}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">{m.plano?.nome ?? '—'}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 md:table-cell">{formatCurrency(m.valor_contratado)}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 lg:table-cell">
                    {formatDate(m.data_inicio)} — {formatDate(m.data_termino)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <MatriculaForm
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function MatriculaForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [form, setForm] = useState({
    aluno_id: '',
    plano_id: '',
    data_inicio: new Date().toISOString().split('T')[0],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ parcelas: number; valorParcela: number; valorTotal: number } | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from('alunos').select('*').eq('status', 'ATIVO').order('nome'),
      supabase.from('planos').select('*').eq('ativo', true).order('duracao_meses'),
    ]).then(([alunosRes, planosRes]) => {
      setAlunos((alunosRes.data ?? []) as Aluno[]);
      setPlanos((planosRes.data ?? []) as Plano[]);
    });
  }, []);

  useEffect(() => {
    if (form.plano_id) {
      const plano = planos.find((p) => p.id === form.plano_id);
      if (plano) {
        setPreview({
          parcelas: plano.duracao_meses,
          valorParcela: plano.valor / plano.duracao_meses,
          valorTotal: plano.valor,
        });
      }
    } else {
      setPreview(null);
    }
  }, [form.plano_id, planos]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.aluno_id || !form.plano_id) {
      setError('Selecione um aluno e um plano.');
      return;
    }
    setSaving(true);
    setError('');

    const plano = planos.find((p) => p.id === form.plano_id);
    if (!plano) {
      setError('Plano inválido.');
      setSaving(false);
      return;
    }

    const dataInicio = new Date(form.data_inicio);
    const dataTermino = new Date(dataInicio);
    dataTermino.setMonth(dataTermino.getMonth() + plano.duracao_meses);

    // Step 1: Create matricula
    const { data: matriculaData, error: matriculaError } = await supabase
      .from('matriculas')
      .insert({
        aluno_id: form.aluno_id,
        plano_id: form.plano_id,
        valor_contratado: plano.valor,
        data_inicio: form.data_inicio,
        data_termino: dataTermino.toISOString().split('T')[0],
        status: 'ATIVA',
      })
      .select()
      .single();

    if (matriculaError || !matriculaData) {
      setError(matriculaError?.message ?? 'Erro ao criar matrícula.');
      setSaving(false);
      return;
    }

    // Step 2: Generate mensalidades (parcels)
    const valorParcela = plano.valor / plano.duracao_meses;
    const mensalidades = Array.from({ length: plano.duracao_meses }, (_, i) => {
      const vencimento = new Date(dataInicio);
      vencimento.setMonth(vencimento.getMonth() + i);
      return {
        matricula_id: matriculaData.id,
        numero_parcela: i + 1,
        total_parcelas: plano.duracao_meses,
        valor: Math.round(valorParcela * 100) / 100,
        data_vencimento: vencimento.toISOString().split('T')[0],
        status: 'PENDENTE' as const,
      };
    });

    const { error: mensError } = await supabase.from('mensalidades').insert(mensalidades);

    if (mensError) {
      setError('Matrícula criada, mas erro ao gerar mensalidades: ' + mensError.message);
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Nova Matrícula" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Aluno *">
          <Select value={form.aluno_id} onChange={(e) => setForm({ ...form, aluno_id: e.target.value })}>
            <option value="">Selecione um aluno...</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>{a.nome}</option>
            ))}
          </Select>
        </Field>
        <Field label="Plano *">
          <Select value={form.plano_id} onChange={(e) => setForm({ ...form, plano_id: e.target.value })}>
            <option value="">Selecione um plano...</option>
            {planos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {formatCurrency(p.valor)} ({p.duracao_meses}x)
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Data de Início *">
          <Input type="date" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
        </Field>

        {preview && (
          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Pré-visualização das parcelas</h4>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-blue-600">Parcelas</p>
                <p className="font-bold text-blue-900">{preview.parcelas}x</p>
              </div>
              <div>
                <p className="text-blue-600">Valor/parcela</p>
                <p className="font-bold text-blue-900">{formatCurrency(preview.valorParcela)}</p>
              </div>
              <div>
                <p className="text-blue-600">Valor total</p>
                <p className="font-bold text-blue-900">{formatCurrency(preview.valorTotal)}</p>
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Criando...' : 'Criar Matrícula e Gerar Parcelas'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
