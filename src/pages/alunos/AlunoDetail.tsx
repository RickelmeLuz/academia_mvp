import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, User, MessageSquare, CreditCard, Receipt, Pencil } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCPF, formatPhone, formatDate, formatCurrency, formatDateTime } from '@/lib/format';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { PageLoader } from '@/components/ui/Spinner';
import type { Aluno, Matricula, Mensalidade, Comunicacao, AlunoStatus } from '@/types';

export function AlunoDetail() {
  const { id } = useParams<{ id: string }>();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [comunicacoes, setComunicacoes] = useState<Comunicacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [tab, setTab] = useState<'matriculas' | 'mensalidades' | 'comunicacoes'>('matriculas');

  useEffect(() => {
    if (!id) return;
    async function load() {
      const [
        { data: alunoData },
        { data: matData },
        { data: mensData },
        { data: comData },
      ] = await Promise.all([
        supabase.from('alunos').select('*').eq('id', id).maybeSingle(),
        supabase.from('matriculas').select('*, plano:planos(*)').eq('aluno_id', id).order('data_criacao', { ascending: false }),
        supabase.from('mensalidades').select('*, matricula:matriculas(*, plano:planos(*))').eq('matricula.aluno_id', id).order('data_vencimento', { ascending: false }),
        supabase.from('comunicacoes').select('*, canal:canais_contato(*), template:templates_mensagem(*)').eq('aluno_id', id).order('data_criacao', { ascending: false }),
      ]);

      setAluno(alunoData as Aluno | null);
      setMatriculas((matData ?? []) as Matricula[]);
      setMensalidades((mensData ?? []) as Mensalidade[]);
      setComunicacoes((comData ?? []) as Comunicacao[]);
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <PageLoader />;
  if (!aluno) return <p className="text-gray-500">Aluno não encontrado.</p>;

  return (
    <div>
      <Link to="/alunos" className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        Voltar para alunos
      </Link>

      {/* Header card */}
      <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{aluno.nome}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(aluno.data_nascimento)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />
                  {formatPhone(aluno.telefone)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-4 w-4" />
                  {aluno.email ?? '—'}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4" />
                  {formatCPF(aluno.cpf)}
                </span>
              </div>
              {aluno.observacoes && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{aluno.observacoes}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={statusBadgeVariant(aluno.status)}>{aluno.status}</Badge>
            <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="flex gap-6">
          {([
            { key: 'matriculas', label: 'Matrículas', count: matriculas.length },
            { key: 'mensalidades', label: 'Mensalidades', count: mensalidades.length },
            { key: 'comunicacoes', label: 'Comunicações', count: comunicacoes.length },
          ] as const).map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t.count}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      {tab === 'matriculas' && (
        <div className="space-y-3">
          {matriculas.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Nenhuma matrícula para este aluno.</p>
          ) : (
            matriculas.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <div>
                  <p className="text-sm font-medium text-gray-900">{m.plano?.nome ?? 'Plano'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatDate(m.data_inicio)} — {formatDate(m.data_termino)} • {formatCurrency(m.valor_contratado)}
                  </p>
                </div>
                <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'mensalidades' && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          {mensalidades.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Nenhuma mensalidade para este aluno.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Parcela</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Vencimento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mensalidades.map((m) => (
                  <tr key={m.id} className={m.status === 'ATRASADO' ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {m.numero_parcela}/{m.total_parcelas}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(m.valor)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(m.data_vencimento)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusBadgeVariant(m.status)}>{m.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'comunicacoes' && (
        <div className="space-y-3">
          {comunicacoes.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Nenhuma comunicação registrada.</p>
          ) : (
            comunicacoes.map((c) => (
              <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{c.assunto ?? 'Sem assunto'}</span>
                  </div>
                  <Badge variant={statusBadgeVariant(c.status)}>{c.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-gray-600">{c.mensagem_enviada}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {c.canal?.nome} • {formatDateTime(c.data_envio ?? c.data_criacao)}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {showEdit && (
        <EditAlunoForm
          aluno={aluno}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

function EditAlunoForm({
  aluno,
  onClose,
  onSaved,
}: {
  aluno: Aluno;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nome: aluno.nome,
    cpf: aluno.cpf ?? '',
    telefone: aluno.telefone ?? '',
    email: aluno.email ?? '',
    data_nascimento: aluno.data_nascimento ?? '',
    status: aluno.status,
    observacoes: aluno.observacoes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase
      .from('alunos')
      .update({
        nome: form.nome.trim(),
        cpf: form.cpf.replace(/\D/g, '') || null,
        telefone: form.telefone.trim() || null,
        email: form.email.trim() || null,
        data_nascimento: form.data_nascimento || null,
        status: form.status as AlunoStatus,
        observacoes: form.observacoes.trim() || null,
      })
      .eq('id', aluno.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title="Editar Aluno" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="CPF">
            <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <Input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
          <Textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={3} />
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
