import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Users, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCPF, formatPhone, formatDate } from '@/lib/format';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Aluno, AlunoStatus } from '@/types';

const statusOptions: ('TODOS' | AlunoStatus)[] = ['TODOS', 'ATIVO', 'INATIVO', 'CANCELADO'];

export function AlunosList() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | AlunoStatus>('TODOS');
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    let query = supabase.from('alunos').select('*').order('nome');
    if (statusFilter !== 'TODOS') query = query.eq('status', statusFilter);
    if (search.trim()) {
      query = query.or(`nome.ilike.%${search.trim()}%,cpf.ilike.%${search.trim()}%,email.ilike.%${search.trim}%`);
    }
    const { data } = await query;
    setAlunos(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [statusFilter, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alunos</h1>
          <p className="mt-1 text-sm text-gray-500">{alunos.length} cadastrados</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar por nome, CPF ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | AlunoStatus)}
          className="sm:w-48"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {s === 'TODOS' ? 'Todos os status' : s}
            </option>
          ))}
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : alunos.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Nenhum aluno encontrado"
            description="Cadastre seu primeiro aluno para começar."
            action={
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Novo Aluno
              </Button>
            }
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Nome</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 sm:table-cell">CPF</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 md:table-cell">Telefone</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 lg:table-cell">Cadastro</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunos.map((aluno) => (
                <tr key={aluno.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/alunos/${aluno.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                      {aluno.nome}
                    </Link>
                    <p className="text-xs text-gray-500 sm:hidden">{formatCPF(aluno.cpf)}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">{formatCPF(aluno.cpf)}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 md:table-cell">{formatPhone(aluno.telefone)}</td>
                  <td className="hidden px-6 py-4 text-sm text-gray-600 lg:table-cell">{formatDate(aluno.data_cadastro)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={statusBadgeVariant(aluno.status)}>{aluno.status}</Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/alunos/${aluno.id}`}
                      className="inline-flex items-center rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <AlunoForm
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AlunoForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    telefone: '',
    email: '',
    data_nascimento: '',
    status: 'ATIVO' as AlunoStatus,
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
    setError('');

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf.replace(/\D/g, '') || null,
      telefone: form.telefone.trim() || null,
      email: form.email.trim() || null,
      data_nascimento: form.data_nascimento || null,
      status: form.status,
      observacoes: form.observacoes.trim() || null,
    };

    const { error: insertError } = await supabase.from('alunos').insert(payload);

    if (insertError) {
      if (insertError.message.includes('cpf')) {
        setError('Já existe um aluno com este CPF.');
      } else {
        setError(insertError.message);
      }
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Novo Aluno" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome completo" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="CPF">
            <Input
              value={form.cpf}
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
              placeholder="000.000.000-00"
            />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} placeholder="(11) 99999-9999" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
          </Field>
          <Field label="Data de Nascimento">
            <Input type="date" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
          </Field>
        </div>
        <Field label="Status">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as AlunoStatus })}>
            <option value="ATIVO">ATIVO</option>
            <option value="INATIVO">INATIVO</option>
            <option value="CANCELADO">CANCELADO</option>
          </Select>
        </Field>
        <Field label="Observações">
          <Input value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} placeholder="Notas sobre o aluno" />
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
