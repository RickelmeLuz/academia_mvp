import { useEffect, useState, useCallback } from 'react';
import { Search, Receipt, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate, daysUntil } from '@/lib/format';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Mensalidade, MensalidadeStatus, FormaPagamento } from '@/types';

const statusOptions: ('TODOS' | MensalidadeStatus)[] = ['TODOS', 'PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO'];
const vencimentoOptions = [
  { value: 'TODOS', label: 'Todos os vencimentos' },
  { value: 'VENCIDAS', label: 'Vencidas' },
  { value: 'SEMANA', label: 'Vence em 7 dias' },
  { value: 'MES', label: 'Vence em 30 dias' },
];

export function Mensalidades() {
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODOS' | MensalidadeStatus>('TODOS');
  const [vencFilter, setVencFilter] = useState('TODOS');
  const [payModal, setPayModal] = useState<Mensalidade | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('mensalidades')
      .select('*, matricula:matriculas(*, aluno:alunos(nome), plano:planos(nome))')
      .order('data_vencimento', { ascending: true });

    if (statusFilter !== 'TODOS') query = query.eq('status', statusFilter);

    const { data } = await query;
    let result = (data ?? []) as Mensalidade[];

    if (vencFilter === 'VENCIDAS') {
      result = result.filter((m) => m.status === 'ATRASADO' || (m.status === 'PENDENTE' && daysUntil(m.data_vencimento) < 0));
    } else if (vencFilter === 'SEMANA') {
      const d = daysUntil;
      result = result.filter((m) => {
        const days = d(m.data_vencimento);
        return days >= 0 && days <= 7;
      });
    } else if (vencFilter === 'MES') {
      const d = daysUntil;
      result = result.filter((m) => {
        const days = d(m.data_vencimento);
        return days >= 0 && days <= 30;
      });
    }

    if (search.trim()) {
      result = result.filter((m) =>
        m.matricula?.aluno?.nome?.toLowerCase().includes(search.trim().toLowerCase())
      );
    }

    setMensalidades(result);
    setLoading(false);
  }, [statusFilter, vencFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalAtrasado = mensalidades
    .filter((m) => m.status === 'ATRASADO')
    .reduce((sum, m) => sum + Number(m.valor), 0);
  const totalPendente = mensalidades
    .filter((m) => m.status === 'PENDENTE')
    .reduce((sum, m) => sum + Number(m.valor), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mensalidades</h1>
        <p className="mt-1 text-sm text-gray-500">Controle de parcelas e pagamentos</p>
      </div>

      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Atrasadas</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-red-600">{formatCurrency(totalAtrasado)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-500" />
            <span className="text-sm font-medium text-gray-600">Pendentes</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600">{formatCurrency(totalPendente)}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium text-gray-600">Total exibido</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-gray-900">{mensalidades.length}</p>
        </div>
      </div>

      {/* Filters */}
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
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'TODOS' | MensalidadeStatus)} className="sm:w-44">
          {statusOptions.map((s) => (
            <option key={s} value={s}>{s === 'TODOS' ? 'Todos os status' : s}</option>
          ))}
        </Select>
        <Select value={vencFilter} onChange={(e) => setVencFilter(e.target.value)} className="sm:w-48">
          {vencimentoOptions.map((v) => (
            <option key={v.value} value={v.value}>{v.label}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : mensalidades.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<Receipt className="h-12 w-12" />}
            title="Nenhuma mensalidade encontrada"
            description="As mensalidades são geradas automaticamente ao criar uma matrícula."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Aluno</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 sm:table-cell">Parcela</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Valor</th>
                <th className="hidden px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500 md:table-cell">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mensalidades.map((m) => {
                const isOverdue = m.status === 'ATRASADO' || (m.status === 'PENDENTE' && daysUntil(m.data_vencimento) < 0);
                return (
                  <tr key={m.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {m.matricula?.aluno?.nome ?? '—'}
                      <p className="text-xs text-gray-500 sm:hidden">
                        {m.numero_parcela}/{m.total_parcelas} • {formatDate(m.data_vencimento)}
                      </p>
                    </td>
                    <td className="hidden px-6 py-4 text-sm text-gray-600 sm:table-cell">
                      {m.numero_parcela}/{m.total_parcelas}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{formatCurrency(m.valor)}</td>
                    <td className="hidden px-6 py-4 text-sm text-gray-600 md:table-cell">
                      {formatDate(m.data_vencimento)}
                      {isOverdue && (
                        <span className="ml-2 text-xs text-red-600 font-medium">
                          ({Math.abs(daysUntil(m.data_vencimento))} dias)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={statusBadgeVariant(isOverdue && m.status === 'PENDENTE' ? 'ATRASADO' : m.status)}>
                        {isOverdue && m.status === 'PENDENTE' ? 'ATRASADO' : m.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status !== 'PAGO' && m.status !== 'CANCELADO' && (
                        <Button variant="success" size="sm" onClick={() => setPayModal(m)}>
                          Marcar Paga
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {payModal && (
        <PayModal
          mensalidade={payModal}
          onClose={() => setPayModal(null)}
          onPaid={() => { setPayModal(null); load(); }}
        />
      )}
    </div>
  );
}

function PayModal({
  mensalidade,
  onClose,
  onPaid,
}: {
  mensalidade: Mensalidade;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [valorPago, setValorPago] = useState(mensalidade.valor.toString());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');

    const { error: updateError } = await supabase
      .from('mensalidades')
      .update({
        status: 'PAGO',
        valor_pago: parseFloat(valorPago) || mensalidade.valor,
        data_pagamento: new Date().toISOString().split('T')[0],
        forma_pagamento: formaPagamento,
      })
      .eq('id', mensalidade.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    onPaid();
  }

  return (
    <Modal open onClose={onClose} title="Registrar Pagamento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4 text-sm">
          <p className="font-medium text-gray-900">{mensalidade.matricula?.aluno?.nome}</p>
          <p className="text-gray-500 mt-1">
            Parcela {mensalidade.numero_parcela}/{mensalidade.total_parcelas} • {formatCurrency(mensalidade.valor)}
          </p>
          <p className="text-gray-500">Vencimento: {formatDate(mensalidade.data_vencimento)}</p>
        </div>
        <Field label="Valor Pago (R$)">
          <Input type="number" step="0.01" value={valorPago} onChange={(e) => setValorPago(e.target.value)} />
        </Field>
        <Field label="Forma de Pagamento">
          <Select value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value as FormaPagamento)}>
            <option value="PIX">PIX</option>
            <option value="CARTAO">Cartão</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="BOLETO">Boleto</option>
          </Select>
        </Field>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="success" disabled={saving}>
            {saving ? 'Registrando...' : 'Confirmar Pagamento'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
