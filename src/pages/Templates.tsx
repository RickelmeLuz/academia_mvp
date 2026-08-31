import { useEffect, useState, useCallback } from 'react';
import { Plus, MessageSquare, Pencil, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Field, Textarea } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoader } from '@/components/ui/Spinner';
import type { TemplateMensagem, TemplateCategoria, CanalContato } from '@/types';

const categorias: TemplateCategoria[] = [
  'COBRANCA', 'VENCIMENTO_PROXIMO', 'ATRASO', 'BOAS_VINDAS',
  'RENOVACAO', 'RECUPERACAO', 'PRIMEIRO_CONTATO_LEAD', 'PROMOCAO', 'OUTRO',
];

const variaveis = ['{{nome}}', '{{valor}}', '{{data_vencimento}}', '{{nome_plano}}'];

const exemploNomes: Record<string, string> = {
  '{{nome}}': 'João',
  '{{valor}}': 'R$ 99,90',
  '{{data_vencimento}}': '15/09/2025',
  '{{nome_plano}}': 'Mensal',
};

function renderPreview(text: string): string {
  return text.replace(/\{\{(\w+)\}\}/g, (match) => exemploNomes[match] ?? match);
}

export function Templates() {
  const [templates, setTemplates] = useState<TemplateMensagem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TemplateMensagem | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateMensagem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('templates_mensagem')
      .select('*, canal:canais_contato(*)')
      .order('data_criacao', { ascending: false });
    setTemplates((data ?? []) as TemplateMensagem[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates de Mensagem</h1>
          <p className="mt-1 text-sm text-gray-500">{templates.length} templates</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus className="h-4 w-4" />
          Novo Template
        </Button>
      </div>

      {loading ? (
        <PageLoader />
      ) : templates.length === 0 ? (
        <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <EmptyState
            icon={<MessageSquare className="h-12 w-12" />}
            title="Nenhum template criado"
            description="Crie templates com variáveis para usar nas comunicações automatizadas."
            action={<Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4" />Novo Template</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={t.ativo ? 'green' : 'gray'}>{t.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-bold text-gray-900">{t.nome}</h3>
              <p className="mt-1">
                <Badge variant="blue">{t.categoria}</Badge>
              </p>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3">{t.corpo_mensagem}</p>
              <p className="mt-2 text-xs text-gray-400">Canal: {t.canal?.nome ?? '—'}</p>
              <div className="mt-4 flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPreviewTemplate(t)}>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setEditing(t); setShowForm(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <TemplateForm
          template={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {previewTemplate && (
        <Modal open onClose={() => setPreviewTemplate(null)} title="Preview do Template" size="lg">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Assunto</p>
              <p className="mt-1 text-sm text-gray-900">{renderPreview(previewTemplate.assunto ?? '—')}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Mensagem</p>
              <div className="mt-1 rounded-lg bg-gray-50 p-4 text-sm text-gray-900 whitespace-pre-wrap">
                {renderPreview(previewTemplate.corpo_mensagem)}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Variáveis disponíveis</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variaveis.map((v) => (
                  <span key={v} className="rounded-md bg-blue-50 px-2 py-1 text-xs font-mono text-blue-700">
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function TemplateForm({
  template,
  onClose,
  onSaved,
}: {
  template: TemplateMensagem | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [canais, setCanais] = useState<CanalContato[]>([]);
  const [form, setForm] = useState({
    nome: template?.nome ?? '',
    categoria: template?.categoria ?? 'OUTRO' as TemplateCategoria,
    canal_id: template?.canal_id ?? '',
    assunto: template?.assunto ?? '',
    corpo_mensagem: template?.corpo_mensagem ?? '',
    ativo: template?.ativo ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('canais_contato').select('*').eq('ativo', true).order('nome').then(({ data }) => {
      setCanais((data ?? []) as CanalContato[]);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.corpo_mensagem.trim()) {
      setError('Nome e corpo da mensagem são obrigatórios.');
      return;
    }
    setSaving(true);
    setError('');

    const payload = {
      nome: form.nome.trim(),
      categoria: form.categoria,
      canal_id: form.canal_id || null,
      assunto: form.assunto.trim() || null,
      corpo_mensagem: form.corpo_mensagem,
      ativo: form.ativo,
    };

    if (template) {
      const { error: updateError } = await supabase.from('templates_mensagem').update(payload).eq('id', template.id);
      if (updateError) { setError(updateError.message); setSaving(false); return; }
    } else {
      const { error: insertError } = await supabase.from('templates_mensagem').insert(payload);
      if (insertError) { setError(insertError.message); setSaving(false); return; }
    }
    onSaved();
  }

  return (
    <Modal open onClose={onClose} title={template ? 'Editar Template' : 'Novo Template'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nome *">
          <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Nome do template" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Categoria">
            <Select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as TemplateCategoria })}>
              {categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
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
        <Field label="Assunto">
          <Input value={form.assunto} onChange={(e) => setForm({ ...form, assunto: e.target.value })} placeholder="Assunto da mensagem" />
        </Field>
        <Field label="Corpo da Mensagem *">
          <Textarea
            value={form.corpo_mensagem}
            onChange={(e) => setForm({ ...form, corpo_mensagem: e.target.value })}
            rows={5}
            placeholder="Use {{nome}}, {{valor}}, {{data_vencimento}}, {{nome_plano}}..."
          />
        </Field>

        {/* Preview */}
        {form.corpo_mensagem && (
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500 mb-1.5">Preview</p>
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-900 whitespace-pre-wrap">
              {renderPreview(form.corpo_mensagem)}
            </div>
          </div>
        )}

        {/* Variable chips */}
        <div className="flex flex-wrap gap-2">
          {variaveis.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setForm({ ...form, corpo_mensagem: form.corpo_mensagem + ' ' + v })}
              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-mono text-blue-700 hover:bg-blue-100 transition-colors"
            >
              {v}
            </button>
          ))}
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
