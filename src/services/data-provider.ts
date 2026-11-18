import type {
  AlteracaoPrioridade,
  AlteracaoPrioridadeInput,
  Ata,
  CreateEscolaInput,
  CreateReuniaoInput,
  CreateUsuarioInput,
  Escola,
  HistoricoDecisaoGrupo,
  HistoricoPrioridadeItem,
  PrioridadeAnual,
  Reuniao,
  SessionUser,
  UpdateEscolaInput,
  UpdateReuniaoInput,
  UpdateUsuarioInput,
  Usuario,
} from "@/types/domain";

export interface DemoStateSummary {
  mode: "mock" | "api";
}

export interface DataProvider {
  readonly mode: "mock" | "api";

  // Autenticação e sessão
  login(email: string, senha: string): Promise<SessionUser>;
  logout(): Promise<void>;
  getCurrentSession(): Promise<SessionUser | null>;

  // Escolas (Superadmin + contexto escolar)
  listarEscolas(incluirInativas?: boolean): Promise<Escola[]>;
  buscarEscolaPorId(id: number): Promise<Escola>;
  criarEscola(input: CreateEscolaInput): Promise<Escola>;
  atualizarEscola(id: number, input: UpdateEscolaInput): Promise<Escola>;

  // Usuários (Superadmin)
  listarUsuarios(escolaId?: number): Promise<Usuario[]>;
  buscarUsuarioPorId(id: number): Promise<Usuario>;
  criarUsuario(input: CreateUsuarioInput): Promise<Usuario>;
  atualizarUsuario(id: number, input: UpdateUsuarioInput): Promise<Usuario>;

  // Prioridades anuais
  listarPrioridades(escolaId: number, ano: number): Promise<PrioridadeAnual[]>;
  buscarHistoricoPrioridade(prioridadeId: number): Promise<HistoricoPrioridadeItem[]>;

  // Reuniões e fluxo de análise/rascunho
  listarReunioes(escolaId: number, ano?: number): Promise<Reuniao[]>;
  buscarReuniaoPorId(id: number): Promise<Reuniao>;
  criarReuniao(input: CreateReuniaoInput): Promise<Reuniao>;
  atualizarReuniao(id: number, input: UpdateReuniaoInput): Promise<Reuniao>;
  excluirReuniao(id: number): Promise<void>;
  analisarReuniao(reuniaoId: number, options?: { simulateFailure?: boolean }): Promise<Ata>;

  // Atas e propostas de alteração
  buscarAtaPorReuniao(reuniaoId: number): Promise<Ata | null>;
  buscarAtaPorId(ataId: number): Promise<Ata>;
  listarAtasConfirmadas(escolaId: number, ano?: number): Promise<HistoricoDecisaoGrupo[]>;
  atualizarTextoAta(ataId: number, texto: string): Promise<Ata>;
  adicionarAlteracao(ataId: number, input: AlteracaoPrioridadeInput): Promise<AlteracaoPrioridade>;
  atualizarAlteracao(
    ataId: number,
    alteracaoId: number,
    input: AlteracaoPrioridadeInput
  ): Promise<AlteracaoPrioridade>;
  removerAlteracao(ataId: number, alteracaoId: number): Promise<void>;
  confirmarAta(ataId: number, diretorId: number): Promise<Ata>;

  // Utilitários de demonstração
  resetDemoState(): Promise<void>;
}
