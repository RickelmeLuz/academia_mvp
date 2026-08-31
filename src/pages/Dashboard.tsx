import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserPlus, AlertTriangle, ListTodo, TrendingUp, Clock, Dumbbell } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatDate } from '@/lib/format';
import { PageLoader } from '@/components/ui/Spinner';
import { Badge, statusBadgeVariant } from '@/components/ui/Badge';
import type { Tarefa } from '@/types';

interface DashboardData {
  alunosAtivos: number;
  leadsAbertos: number;
  mensalidadesAtrasadas: number;
  valorAtrasado: number;
  tarefasPendentes: number;
  tarefasHoje: Tarefa[];
  totalAlunos: number;
  totalMensalidadesPendentes: number;
  valorPendente: number;
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { count: alunosAtivos },
        { count: totalAlunos },
        { count: leadsAbertos },
        { data: atrasadas },
        { data: pendentes },
        { count: tarefasPendentes },
        { data: tarefasHoje },
      ] = await Promise.all([
        supabase.from('alunos').select('*', { count: 'exact', head: true }).eq('status', 'ATIVO'),
        supabase.from('alunos').select('*', { count: 'exact', head: true }),
        supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('status', ['NOVO', 'CONTATADO', 'VISITOU', 'NEGOCIANDO']),
        supabase.from('mensalidades').select('valor').eq('status', 'ATRASADO'),
        supabase.from('mensalidades').select('valor').eq('status', 'PENDENTE'),
        supabase.from('tarefas').select('*', { count: 'exact', head: true }).eq('status', 'PENDENTE'),
        supabase
          .from('tarefas')
          .select('*, aluno:alunos(nome), lead:leads(nome)')
          .eq('status', 'PENDENTE')
          .eq('data_vencimento', new Date().toISOString().split('T')[0])
          .order('prioridade', { ascending: false }),
      ]);

      const valorAtrasado = (atrasadas ?? []).reduce((sum, m) => sum + Number(m.valor), 0);
      const valorPendente = (pendentes ?? []).reduce((sum, m) => sum + Number(m.valor), 0);

      setData({
        alunosAtivos: alunosAtivos ?? 0,
        totalAlunos: totalAlunos ?? 0,
        leadsAbertos: leadsAbertos ?? 0,
        mensalidadesAtrasadas: (atrasadas ?? []).length,
        valorAtrasado,
        tarefasPendentes: tarefasPendentes ?? 0,
        tarefasHoje: (tarefasHoje ?? []) as unknown as Tarefa[],
        totalMensalidadesPendentes: (pendentes ?? []).length,
        valorPendente,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <p className="text-gray-500">Erro ao carregar dados.</p>;

  const cards = [
    {
      label: 'Alunos Ativos',
      value: data.alunosAtivos.toString(),
      sub: `${data.totalAlunos} no total`,
      icon: Users,
      color: 'bg-blue-500',
      bg: 'bg-blue-50',
      link: '/alunos',
    },
    {
      label: 'Leads em Aberto',
      value: data.leadsAbertos.toString(),
      sub: 'Aguardando contato',
      icon: UserPlus,
      color: 'bg-violet-500',
      bg: 'bg-violet-50',
      link: '/leads',
    },
    {
      label: 'Mensalidades Atrasadas',
      value: data.mensalidadesAtrasadas.toString(),
      sub: formatCurrency(data.valorAtrasado),
      icon: AlertTriangle,
      color: 'bg-red-500',
      bg: 'bg-red-50',
      link: '/mensalidades',
    },
    {
      label: 'Tarefas Pendentes',
      value: data.tarefasPendentes.toString(),
      sub: `${data.tarefasHoje.length} para hoje`,
      icon: ListTodo,
      color: 'bg-amber-500',
      bg: 'bg-amber-50',
      link: '/tarefas',
    },
  ];

  return (
    <div>
      {/* Header with dumbbell accent */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <Dumbbell className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">Visão geral da academia em tempo real</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              to={card.link}
              className="group rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md hover:ring-gray-300"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="mt-1 text-sm font-medium text-gray-600">{card.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{card.sub}</p>
            </Link>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <Clock className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-semibold">Mensalidades Pendentes</h3>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {data.totalMensalidadesPendentes}
          </p>
          <p className="text-sm text-gray-500">{formatCurrency(data.valorPendente)} em aberto</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-sm font-semibold">Taxa de Conversão de Leads</h3>
          </div>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {data.leadsAbertos + data.alunosAtivos > 0
              ? Math.round((data.alunosAtivos / (data.leadsAbertos + data.alunosAtivos)) * 100)
              : 0}
            %
          </p>
          <p className="text-sm text-gray-500">Baseado em leads e alunos ativos</p>
        </div>
      </div>

      {/* Today's tasks */}
      <div className="mt-6 rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-gray-900">Tarefas de Hoje</h3>
          <Link to="/tarefas" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Ver todas
          </Link>
        </div>
        {data.tarefasHoje.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-500">
            Nenhuma tarefa para hoje. Dia livre!
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.tarefasHoje.map((tarefa) => (
              <li key={tarefa.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tarefa.titulo}</p>
                  {tarefa.descricao && (
                    <p className="text-xs text-gray-500 mt-0.5">{tarefa.descricao}</p>
                  )}
                </div>
                <Badge variant={statusBadgeVariant(tarefa.prioridade)}>{tarefa.prioridade}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
