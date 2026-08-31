export type AlunoStatus = 'ATIVO' | 'INATIVO' | 'CANCELADO';
export type LeadStatus = 'NOVO' | 'CONTATADO' | 'VISITOU' | 'NEGOCIANDO' | 'CONVERTIDO' | 'PERDIDO';
export type MatriculaStatus = 'ATIVA' | 'INADIMPLENTE' | 'SUSPENSA' | 'CANCELADA' | 'ENCERRADA';
export type MensalidadeStatus = 'PENDENTE' | 'PAGO' | 'ATRASADO' | 'CANCELADO';
export type FormaPagamento = 'PIX' | 'CARTAO' | 'DINHEIRO' | 'BOLETO';
export type TemplateCategoria =
  | 'COBRANCA'
  | 'VENCIMENTO_PROXIMO'
  | 'ATRASO'
  | 'BOAS_VINDAS'
  | 'RENOVACAO'
  | 'RECUPERACAO'
  | 'PRIMEIRO_CONTATO_LEAD'
  | 'PROMOCAO'
  | 'OUTRO';
export type EventoGatilho =
  | 'VENCIMENTO_PROXIMO'
  | 'PAGAMENTO_ATRASADO'
  | 'MATRICULA_A_VENCER'
  | 'AUSENCIA_PROLONGADA'
  | 'NOVO_LEAD'
  | 'BOAS_VINDAS';
export type ComunicacaoStatus = 'AGENDADA' | 'ENVIADA' | 'FALHOU' | 'LIDA' | 'RESPONDIDA' | 'CANCELADA';
export type TarefaPrioridade = 'BAIXA' | 'MEDIA' | 'ALTA';
export type TarefaStatus = 'PENDENTE' | 'CONCLUIDA' | 'CANCELADA';

export interface CanalContato {
  id: string;
  nome: string;
  ativo: boolean;
  data_criacao: string;
}

export interface Plano {
  id: string;
  nome: string;
  valor: number;
  duracao_meses: number;
  ativo: boolean;
  data_criacao: string;
}

export interface Aluno {
  id: string;
  nome: string;
  cpf: string | null;
  telefone: string | null;
  email: string | null;
  data_nascimento: string | null;
  data_cadastro: string;
  status: AlunoStatus;
  observacoes: string | null;
  lead_origem_id: string | null;
  data_atualizacao: string;
}

export interface Lead {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  origem: string | null;
  interesse: string | null;
  status: LeadStatus;
  data_cadastro: string;
  data_ultimo_contato: string | null;
  observacoes: string | null;
  aluno_convertido_id: string | null;
}

export interface Matricula {
  id: string;
  aluno_id: string;
  plano_id: string;
  valor_contratado: number;
  data_inicio: string;
  data_termino: string | null;
  status: MatriculaStatus;
  data_criacao: string;
  data_atualizacao: string;
  plano?: Plano;
  aluno?: Aluno;
}

export interface Mensalidade {
  id: string;
  matricula_id: string;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  valor_pago: number | null;
  data_vencimento: string;
  data_pagamento: string | null;
  forma_pagamento: FormaPagamento | null;
  status: MensalidadeStatus;
  observacoes: string | null;
  data_criacao: string;
  matricula?: Matricula;
}

export interface TemplateMensagem {
  id: string;
  nome: string;
  categoria: TemplateCategoria;
  canal_id: string | null;
  assunto: string | null;
  corpo_mensagem: string;
  ativo: boolean;
  data_criacao: string;
  data_atualizacao: string;
  canal?: CanalContato;
}

export interface RegraAutomacao {
  id: string;
  nome: string;
  evento_gatilho: EventoGatilho;
  dias_referencia: number;
  template_id: string | null;
  canal_id: string | null;
  ativo: boolean;
  data_criacao: string;
  template?: TemplateMensagem;
  canal?: CanalContato;
}

export interface Comunicacao {
  id: string;
  lead_id: string | null;
  aluno_id: string | null;
  matricula_id: string | null;
  mensalidade_id: string | null;
  canal_id: string | null;
  template_id: string | null;
  regra_automacao_id: string | null;
  assunto: string | null;
  mensagem_enviada: string | null;
  status: ComunicacaoStatus;
  data_agendamento: string | null;
  data_envio: string | null;
  data_leitura: string | null;
  resposta: string | null;
  data_resposta: string | null;
  erro_envio: string | null;
  data_criacao: string;
  canal?: CanalContato;
  aluno?: Aluno;
  lead?: Lead;
  template?: TemplateMensagem;
}

export interface Tarefa {
  id: string;
  lead_id: string | null;
  aluno_id: string | null;
  titulo: string;
  descricao: string | null;
  data_vencimento: string | null;
  prioridade: TarefaPrioridade;
  status: TarefaStatus;
  data_conclusao: string | null;
  data_criacao: string;
  aluno?: Aluno;
  lead?: Lead;
}
