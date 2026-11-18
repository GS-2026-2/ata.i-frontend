export type TipoUsuario = "SUPERADMIN" | "DIRETOR" | "COORDENADOR" | "PROFESSOR";

export type StatusAta = "MINUTA" | "APROVADA";

export type OperacaoPrioridade = "INCLUIR" | "ATUALIZAR" | "REMOVER";

export type TipoConteudoReuniao = "TRANSCRICAO" | "ATA_PRONTA";

export type SituacaoFluxoReuniao =
  | "RASCUNHO"
  | "EM_ANALISE"
  | "EM_REVISAO"
  | "FALHA_ANALISE"
  | "CONFIRMADA";

export interface Escola {
  id: number;
  nome: string;
  ativa: boolean;
  criadaEm: string;
  localizacao?: string;
}

export interface Usuario {
  id: number;
  escolaId: number | null;
  escolaNome: string | null;
  nome: string;
  email: string;
  tipo: TipoUsuario;
  ativo: boolean;
  criadoEm: string;
}

export interface UsuarioComCredencial extends Usuario {
  senha: string;
}

export interface PrioridadeAnual {
  id: number;
  escolaId: number;
  escolaNome: string;
  anoReferencia: number;
  descricao: string;
  ordem: number;
  ativa: boolean;
  ultimaDecisaoEm?: string | null;
  ultimaAtaId?: number | null;
}

export interface AlteracaoPrioridade {
  id: number;
  ataId: number;
  prioridadeId: number | null;
  operacao: OperacaoPrioridade;
  descricaoProposta: string | null;
  ordemProposta: number | null;
  justificativa: string | null;
  trechoOrigem: string | null;
  efeitoResumo?: string | null;
}

export interface Ata {
  id: number;
  reuniaoId: number;
  reuniaoTitulo: string;
  escolaId: number;
  anoReferencia: number;
  texto: string;
  status: StatusAta;
  criadaEm: string;
  aprovadaEm: string | null;
  aprovadaPorId: number | null;
  aprovadaPorNome: string | null;
  alteracoes: AlteracaoPrioridade[];
  origemDocumento?: TipoConteudoReuniao;
}

export interface Reuniao {
  id: number;
  escolaId: number;
  escolaNome: string;
  criadaPorId: number;
  criadaPorNome: string;
  titulo: string;
  dataReuniao: string; // YYYY-MM-DD
  anoReferencia: number;
  transcricao: string | null;
  criadaEm: string;
  tipoConteudo: TipoConteudoReuniao;
  situacaoFluxo: SituacaoFluxoReuniao;
  textoAtaEnviada?: string | null;
  erroAnaliseMensagem?: string | null;
}

export interface HistoricoPrioridadeItem {
  alteracaoId: number;
  ataId: number;
  statusAta: StatusAta;
  aprovadaEm: string | null;
  aprovadaPorId: number | null;
  aprovadaPorNome: string | null;
  reuniaoId: number;
  reuniaoTitulo: string;
  dataReuniao: string;
  operacao: OperacaoPrioridade;
  descricaoProposta: string | null;
  ordemProposta: number | null;
  justificativa: string | null;
  trechoOrigem: string | null;
}

export interface HistoricoDecisaoGrupo {
  ata: Ata;
  reuniao: Reuniao;
  resumoCurto: string;
}

export interface SessionUser {
  usuario: Usuario;
  escola: Escola | null;
}

export interface CreateEscolaInput {
  nome: string;
  ativa?: boolean;
  localizacao?: string;
}

export interface UpdateEscolaInput {
  nome: string;
  ativa: boolean;
  localizacao?: string;
}

export interface CreateUsuarioInput {
  escolaId: number | null;
  nome: string;
  email: string;
  senhaHash: string;
  tipo: TipoUsuario;
  ativo?: boolean;
}

export interface UpdateUsuarioInput {
  escolaId: number | null;
  nome: string;
  email: string;
  senhaHash?: string;
  tipo: TipoUsuario;
  ativo: boolean;
}

export interface CreateReuniaoInput {
  escolaId: number;
  usuarioId: number;
  titulo: string;
  dataReuniao: string;
  anoReferencia: number;
  tipoConteudo: TipoConteudoReuniao;
  conteudo: string;
}

export interface UpdateReuniaoInput {
  titulo: string;
  dataReuniao: string;
  anoReferencia: number;
  tipoConteudo: TipoConteudoReuniao;
  conteudo: string;
}

export interface AlteracaoPrioridadeInput {
  operacao: OperacaoPrioridade;
  prioridadeId: number | null;
  descricaoProposta: string | null;
  ordemProposta: number | null;
  justificativa: string | null;
  trechoOrigem: string | null;
}

export interface ApiErrorPayload {
  timestamp?: string;
  status: number;
  error?: string;
  message: string;
  path?: string;
  fieldErrors?: Array<{ field: string; message: string }>;
}

export class DataProviderError extends Error {
  status: number;
  fieldErrors?: Array<{ field: string; message: string }>;

  constructor(
    message: string,
    status = 400,
    fieldErrors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "DataProviderError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}
