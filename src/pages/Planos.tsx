import { useEffect, useState, useCallback } from 'react';
import { Plus, CreditCard, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { Plano } from '@/types';

export function Planos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('planos').select('*').order('duracao_meses');
    setPlanos(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleAtivo(plano: Plano) {
    await supabase.from('planos').update({ ativo: !plano.ativo }).eq('id', plano.id);
    setPlanos((prev) => prev.map((p) => (p.id === plano.id ? { ...p, ativo: !p.ativo } : p)));
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planos</h1>
          <p className="mt-1 text-sm text-gray-500">{planos.length} planos cadastrados</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : planos.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<CreditCard className="h-12 w-12" />}
            title="Nenhum plano cadastrado"
            description="Crie planos para vincular às matrículas dos alunos."
            action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Novo Plano</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map((plano) => (
            <div key={plano.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <Badge variant={plano.ativo ? 'green' : 'gray'}>
                  {plano.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{plano.nome}</h3>
              <p className="mt-1 text-2xl font-bold text-blue-600">{formatCurrency(plano.valor)}</p>
              <p className="mt-1 text-sm text-gray-500">
                {plano.duracao_meses} {plano.duracao_meses === 1 ? 'mês' : 'meses'}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => { setEditing(plano); setShowForm(true); }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAtivo(plano)}>
                  {plano.ativo ? 'Desativar' : 'Ativar'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PlanoForm
          plano={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function PlanoForm({
  plano,
  onClose,
  onSaved,
}: {
  plano: Plano | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nome: plano?.nome ?? '',
    valor: plano?.valor?.toString() ?? '',
    duracao_meses: plano?.duracao_meses?.toString() ?? '1',
    ativo: plano?.ativo ?? true,
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
      valor: parseFloat(form.valor) || 0,
      duracao_meses: parseInt(form.duracao_meses) || 1,
      ativo: form.ativo,
    };

    if (plano) {
      const { error: updateError } = await supabase.from('planos').update(payload).eq('id', plano.id);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
    } else {
      const { error: insertError } = await supabase.from('planos').insert(payload);
      if (insertError) { setError(insertError.message); setSaving(false); return; }
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={plano ? 'Editar Plano' : 'Novo Plano'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Mensal, Trimestral, Anual..." />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor (R$) *">
            <Input type="number" step="0.01" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="99.90" />
          </Field>
          <Field label="Duração (meses) *">
            <Input type="number" min="1" value={form.duracao_meses} onChange={(e) => setForm({ ...form, duracao_meses: e.target.value })} />
          </Field>
        </div>
        <Field label="Status">
          <Select value={form.ativo ? 'true' : 'false'} onChange={(e) => setForm({ ...form, ativo: e.target.value === 'true' })}>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
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
