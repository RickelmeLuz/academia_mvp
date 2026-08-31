import { ReactNode } from 'react';

type Variant = 'gray' | 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'orange';

const variants: Record<Variant, string> = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  yellow: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
};

export function Badge({
  children,
  variant = 'gray',
}: {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

export function statusBadgeVariant(status: string): Variant {
  switch (status) {
    case 'ATIVO':
    case 'ATIVA':
    case 'PAGO':
    case 'CONCLUIDA':
    case 'ENVIADA':
    case 'LIDA':
    case 'RESPONDIDA':
      return 'green';
    case 'INATIVO':
    case 'ENCERRADA':
    case 'CANCELADO':
    case 'CANCELADA':
    case 'PERDIDO':
    case 'FALHOU':
    case 'BAIXA':
      return 'gray';
    case 'INADIMPLENTE':
    case 'ATRASADO':
    case 'ALTA':
      return 'red';
    case 'SUSPENSA':
    case 'PENDENTE':
    case 'AGENDADA':
    case 'NOVO':
    case 'MEDIA':
      return 'yellow';
    case 'CONTATADO':
    case 'VISITOU':
      return 'blue';
    case 'NEGOCIANDO':
    case 'CONVERTIDO':
      return 'purple';
    default:
      return 'gray';
  }
}
