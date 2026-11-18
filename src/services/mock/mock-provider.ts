import {
  formatOrderTwoDigits,
  getPropostaEfeitoHistorico,
} from "@/lib/formatters";
import type { DataProvider } from "@/services/data-provider";
import { generateMockAnalysis } from "@/services/mock/analyzer";
import type { MockDatabaseState } from "@/services/mock/seed";
import {
  loadMockState,
  resetMockState,
  saveMockState,
} from "@/services/mock/storage";
import {
  DataProviderError,
  type AlteracaoPrioridade,
  type AlteracaoPrioridadeInput,
  type Ata,
  type CreateEscolaInput,
  type CreateReuniaoInput,
  type CreateUsuarioInput,
  type Escola,
  type HistoricoDecisaoGrupo,
  type HistoricoPrioridadeItem,
  type PrioridadeAnual,
  type Reuniao,
  type SessionUser,
  type UpdateEscolaInput,
  type UpdateReuniaoInput,
  type UpdateUsuarioInput,
  type Usuario,
  type UsuarioComCredencial,
} from "@/types/domain";

function stripCredential(u: UsuarioComCredencial): Usuario {
  const { senha: _ignored, ...rest } = u;
  void _ignored;
  return rest;
}

function resolveSession(state: MockDatabaseState): SessionUser | null {
  if (state.currentUserId == null) return null;
  const user = state.usuarios.find((u) => u.id === state.currentUserId);
  if (!user || !user.ativo) return null;
  const escola =
    user.escolaId != null
      ? state.escolas.find((e) => e.id === user.escolaId) ?? null
      : null;
  return {
    usuario: stripCredential(user),
    escola,
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

export class MockDataProvider implements DataProvider {
  readonly mode = "mock" as const;

  private getState(): MockDatabaseState {
    return loadMockState();
  }

  private commit(state: MockDatabaseState): void {
    saveMockState(state);
  }

  async login(email: string, senha: string): Promise<SessionUser> {
    const state = this.getState();
    const normalizedEmail = email.trim().toLowerCase();
    const found = state.usuarios.find(
      (u) => u.email.trim().toLowerCase() === normalizedEmail
    );

    if (!found || found.senha !== senha) {
      throw new DataProviderError(
        "E-mail ou senha incorretos. Confira os dados e tente novamente.",
        401
      );
    }

    if (!found.ativo) {
      throw new DataProviderError(
        "Este usuário está inativo. Procure o administrador responsável pelo seu acesso.",
        403
      );
    }

    if (found.escolaId != null) {
      const escola = state.escolas.find((e) => e.id === found.escolaId);
      if (!escola || !escola.ativa) {
        throw new DataProviderError(
          "A escola vinculada a este usuário está inativa no momento.",
          403
        );
      }
    }

    state.currentUserId = found.id;
    this.commit(state);

    const escola =
      found.escolaId != null
        ? state.escolas.find((e) => e.id === found.escolaId) ?? null
        : null;

    return {
      usuario: stripCredential(found),
      escola,
    };
  }

  async logout(): Promise<void> {
    const state = this.getState();
    state.currentUserId = null;
    this.commit(state);
  }

  async getCurrentSession(): Promise<SessionUser | null> {
    const state = this.getState();
    return resolveSession(state);
  }

  async listarEscolas(incluirInativas = true): Promise<Escola[]> {
    const state = this.getState();
    return state.escolas
      .filter((e) => incluirInativas || e.ativa)
      .slice()
      .sort((a, b) => a.id - b.id);
  }

  async buscarEscolaPorId(id: number): Promise<Escola> {
    const state = this.getState();
    const escola = state.escolas.find((e) => e.id === id);
    if (!escola) {
      throw new DataProviderError(`Escola não encontrada: ${id}`, 404);
    }
    return escola;
  }

  async criarEscola(input: CreateEscolaInput): Promise<Escola> {
    const state = this.getState();
    const nome = input.nome.trim();
    if (!nome) {
      throw new DataProviderError("Nome da escola é obrigatório.", 422);
    }
    const duplicate = state.escolas.some(
      (e) => e.nome.trim().toLowerCase() === nome.toLowerCase()
    );
    if (duplicate) {
      throw new DataProviderError("Já existe uma escola cadastrada com este nome.", 409);
    }

    const nova: Escola = {
      id: state.nextIds.escola++,
      nome,
      ativa: input.ativa ?? true,
      criadaEm: nowIso(),
      localizacao: input.localizacao?.trim() || "Rede Municipal · São Paulo",
    };
    state.escolas.push(nova);
    this.commit(state);
    return nova;
  }

  async atualizarEscola(id: number, input: UpdateEscolaInput): Promise<Escola> {
    const state = this.getState();
    const escola = state.escolas.find((e) => e.id === id);
    if (!escola) {
      throw new DataProviderError(`Escola não encontrada: ${id}`, 404);
    }
    const nome = input.nome.trim();
    if (!nome) {
      throw new DataProviderError("Nome da escola é obrigatório.", 422);
    }
    const duplicate = state.escolas.some(
      (e) => e.id !== id && e.nome.trim().toLowerCase() === nome.toLowerCase()
    );
    if (duplicate) {
      throw new DataProviderError("Já existe outra escola com este nome.", 409);
    }

    escola.nome = nome;
    escola.ativa = input.ativa;
    if (input.localizacao !== undefined) {
      escola.localizacao = input.localizacao.trim() || escola.localizacao;
    }

    // Sincroniza o nome da escola nos registros derivados
    for (const u of state.usuarios) {
      if (u.escolaId === id) u.escolaNome = nome;
    }
    for (const p of state.prioridades) {
      if (p.escolaId === id) p.escolaNome = nome;
    }
    for (const r of state.reunioes) {
      if (r.escolaId === id) r.escolaNome = nome;
    }

    this.commit(state);
    return escola;
  }

  async listarUsuarios(escolaId?: number): Promise<Usuario[]> {
    const state = this.getState();
    return state.usuarios
      .filter((u) => (escolaId != null ? u.escolaId === escolaId : true))
      .map(stripCredential)
      .sort((a, b) => a.id - b.id);
  }

  async buscarUsuarioPorId(id: number): Promise<Usuario> {
    const state = this.getState();
    const usuario = state.usuarios.find((u) => u.id === id);
    if (!usuario) {
      throw new DataProviderError(`Usuário não encontrado: ${id}`, 404);
    }
    return stripCredential(usuario);
  }

  async criarUsuario(input: CreateUsuarioInput): Promise<Usuario> {
    const state = this.getState();
    const nome = input.nome.trim();
    const email = input.email.trim().toLowerCase();

    if (!nome) throw new DataProviderError("Nome completo é obrigatório.", 422);
    if (!email) throw new DataProviderError("E-mail é obrigatório.", 422);
    if (!input.senhaHash.trim()) {
      throw new DataProviderError("Senha inicial é obrigatória.", 422);
    }

    const emailExists = state.usuarios.some(
      (u) => u.email.trim().toLowerCase() === email
    );
    if (emailExists) {
      throw new DataProviderError("Já existe um usuário cadastrado com este e-mail.", 409);
    }

    let escolaNome: string | null = null;
    let escolaId: number | null = input.escolaId;
    if (input.tipo === "SUPERADMIN") {
      escolaId = null;
      escolaNome = null;
    } else {
      if (escolaId == null) {
        throw new DataProviderError(
          "Escola é obrigatória para perfis escolares (Diretor, Coordenador ou Professor).",
          422
        );
      }
      const escola = state.escolas.find((e) => e.id === escolaId);
      if (!escola) {
        throw new DataProviderError("Escola selecionada não encontrada.", 404);
      }
      escolaNome = escola.nome;
    }

    const novo: UsuarioComCredencial = {
      id: state.nextIds.usuario++,
      escolaId,
      escolaNome,
      nome,
      email,
      senha: input.senhaHash,
      tipo: input.tipo,
      ativo: input.ativo ?? true,
      criadoEm: nowIso(),
    };
    state.usuarios.push(novo);
    this.commit(state);
    return stripCredential(novo);
  }

  async atualizarUsuario(id: number, input: UpdateUsuarioInput): Promise<Usuario> {
    const state = this.getState();
    const usuario = state.usuarios.find((u) => u.id === id);
    if (!usuario) {
      throw new DataProviderError(`Usuário não encontrado: ${id}`, 404);
    }

    const nome = input.nome.trim();
    const email = input.email.trim().toLowerCase();
    if (!nome) throw new DataProviderError("Nome completo é obrigatório.", 422);
    if (!email) throw new DataProviderError("E-mail é obrigatório.", 422);

    const emailExists = state.usuarios.some(
      (u) => u.id !== id && u.email.trim().toLowerCase() === email
    );
    if (emailExists) {
      throw new DataProviderError("Já existe outro usuário cadastrado com este e-mail.", 409);
    }

    let escolaId = input.escolaId;
    let escolaNome: string | null = null;
    if (input.tipo === "SUPERADMIN") {
      escolaId = null;
    } else {
      if (escolaId == null) {
        throw new DataProviderError(
          "Escola é obrigatória para perfis escolares.",
          422
        );
      }
      const escola = state.escolas.find((e) => e.id === escolaId);
      if (!escola) {
        throw new DataProviderError("Escola selecionada não encontrada.", 404);
      }
      escolaNome = escola.nome;
    }

    usuario.nome = nome;
    usuario.email = email;
    usuario.tipo = input.tipo;
    usuario.escolaId = escolaId;
    usuario.escolaNome = escolaNome;
    usuario.ativo = input.ativo;
    if (input.senhaHash && input.senhaHash.trim().length > 0) {
      usuario.senha = input.senhaHash.trim();
    }

    this.commit(state);
    return stripCredential(usuario);
  }

  async listarPrioridades(escolaId: number, ano: number): Promise<PrioridadeAnual[]> {
    const state = this.getState();
    return state.prioridades
      .filter((p) => p.escolaId === escolaId && p.anoReferencia === ano && p.ativa)
      .slice()
      .sort((a, b) => a.ordem - b.ordem || a.id - b.id);
  }

  async buscarHistoricoPrioridade(
    prioridadeId: number
  ): Promise<HistoricoPrioridadeItem[]> {
    const state = this.getState();
    const itens: HistoricoPrioridadeItem[] = [];
    for (const ata of state.atas) {
      if (ata.status !== "APROVADA") continue;
      const reuniao = state.reunioes.find((r) => r.id === ata.reuniaoId);
      if (!reuniao) continue;
      for (const alt of ata.alteracoes) {
        if (alt.prioridadeId !== prioridadeId) continue;
        itens.push({
          alteracaoId: alt.id,
          ataId: ata.id,
          statusAta: ata.status,
          aprovadaEm: ata.aprovadaEm,
          aprovadaPorId: ata.aprovadaPorId,
          aprovadaPorNome: ata.aprovadaPorNome,
          reuniaoId: reuniao.id,
          reuniaoTitulo: reuniao.titulo,
          dataReuniao: reuniao.dataReuniao,
          operacao: alt.operacao,
          descricaoProposta: alt.descricaoProposta,
          ordemProposta: alt.ordemProposta,
          justificativa: alt.justificativa,
          trechoOrigem: alt.trechoOrigem,
        });
      }
    }
    return itens.sort((a, b) => b.dataReuniao.localeCompare(a.dataReuniao));
  }

  async listarReunioes(escolaId: number, ano?: number): Promise<Reuniao[]> {
    const state = this.getState();
    return state.reunioes
      .filter(
        (r) => r.escolaId === escolaId && (ano != null ? r.anoReferencia === ano : true)
      )
      .slice()
      .sort((a, b) => b.dataReuniao.localeCompare(a.dataReuniao) || b.id - a.id);
  }

  async buscarReuniaoPorId(id: number): Promise<Reuniao> {
    const state = this.getState();
    const reuniao = state.reunioes.find((r) => r.id === id);
    if (!reuniao) {
      throw new DataProviderError(`Reunião não encontrada: ${id}`, 404);
    }
    return reuniao;
  }

  async criarReuniao(input: CreateReuniaoInput): Promise<Reuniao> {
    const state = this.getState();
    const escola = state.escolas.find((e) => e.id === input.escolaId);
    if (!escola || !escola.ativa) {
      throw new DataProviderError("Escola inválida ou inativa.", 422);
    }
    const criador = state.usuarios.find((u) => u.id === input.usuarioId);
    if (!criador || !criador.ativo) {
      throw new DataProviderError("Usuário criador inválido ou inativo.", 422);
    }
    if (criador.tipo !== "DIRETOR" && criador.tipo !== "COORDENADOR") {
      throw new DataProviderError(
        "Somente diretor ou coordenador pode registrar reuniões.",
        403
      );
    }

    const nova: Reuniao = {
      id: state.nextIds.reuniao++,
      escolaId: escola.id,
      escolaNome: escola.nome,
      criadaPorId: criador.id,
      criadaPorNome: criador.nome,
      titulo: input.titulo.trim(),
      dataReuniao: input.dataReuniao,
      anoReferencia: input.anoReferencia,
      transcricao:
        input.tipoConteudo === "TRANSCRICAO" ? input.conteudo.trim() : null,
      textoAtaEnviada:
        input.tipoConteudo === "ATA_PRONTA" ? input.conteudo.trim() : null,
      criadaEm: nowIso(),
      tipoConteudo: input.tipoConteudo,
      situacaoFluxo: "RASCUNHO",
    };

    state.reunioes.push(nova);
    this.commit(state);
    return nova;
  }

  async atualizarReuniao(id: number, input: UpdateReuniaoInput): Promise<Reuniao> {
    const state = this.getState();
    const reuniao = state.reunioes.find((r) => r.id === id);
    if (!reuniao) {
      throw new DataProviderError(`Reunião não encontrada: ${id}`, 404);
    }
    const ata = state.atas.find((a) => a.reuniaoId === id);
    if (ata && ata.status === "APROVADA") {
      throw new DataProviderError(
        "Não é possível alterar reunião com ata já aprovada.",
        422
      );
    }

    reuniao.titulo = input.titulo.trim();
    reuniao.dataReuniao = input.dataReuniao;
    reuniao.anoReferencia = input.anoReferencia;
    reuniao.tipoConteudo = input.tipoConteudo;
    if (input.tipoConteudo === "TRANSCRICAO") {
      reuniao.transcricao = input.conteudo.trim();
      reuniao.textoAtaEnviada = null;
    } else {
      reuniao.textoAtaEnviada = input.conteudo.trim();
      reuniao.transcricao = null;
    }

    if (reuniao.situacaoFluxo === "FALHA_ANALISE") {
      reuniao.situacaoFluxo = "RASCUNHO";
      reuniao.erroAnaliseMensagem = null;
    }

    this.commit(state);
    return reuniao;
  }

  async excluirReuniao(id: number): Promise<void> {
    const state = this.getState();
    const idx = state.reunioes.findIndex((r) => r.id === id);
    if (idx === -1) {
      throw new DataProviderError(`Reunião não encontrada: ${id}`, 404);
    }
    const ata = state.atas.find((a) => a.reuniaoId === id);
    if (ata && ata.status === "APROVADA") {
      throw new DataProviderError(
        "Não é possível excluir reunião com ata já aprovada.",
        422
      );
    }

    state.atas = state.atas.filter((a) => a.reuniaoId !== id);
    state.reunioes.splice(idx, 1);
    this.commit(state);
  }

  async analisarReuniao(
    reuniaoId: number,
    options?: { simulateFailure?: boolean }
  ): Promise<Ata> {
    const state = this.getState();
    const reuniao = state.reunioes.find((r) => r.id === reuniaoId);
    if (!reuniao) {
      throw new DataProviderError(`Reunião não encontrada: ${reuniaoId}`, 404);
    }

    const existingAta = state.atas.find((a) => a.reuniaoId === reuniaoId);
    if (existingAta && existingAta.status === "APROVADA") {
      return existingAta;
    }

    const conteudo =
      reuniao.tipoConteudo === "ATA_PRONTA"
        ? reuniao.textoAtaEnviada || reuniao.transcricao || ""
        : reuniao.transcricao || "";

    if (!conteudo.trim()) {
      reuniao.situacaoFluxo = "FALHA_ANALISE";
      reuniao.erroAnaliseMensagem =
        "Conteúdo vazio para análise. Preencha o texto antes de tentar novamente.";
      this.commit(state);
      throw new DataProviderError(reuniao.erroAnaliseMensagem, 422);
    }

    if (options?.simulateFailure || /\[ERRO\]/i.test(conteudo)) {
      reuniao.situacaoFluxo = "FALHA_ANALISE";
      reuniao.erroAnaliseMensagem =
        "Falha simulada durante a análise do conteúdo enviado.";
      this.commit(state);
      throw new DataProviderError(reuniao.erroAnaliseMensagem, 503);
    }

    const prioridadesAtivas = state.prioridades
      .filter(
        (p) =>
          p.escolaId === reuniao.escolaId &&
          p.anoReferencia === reuniao.anoReferencia &&
          p.ativa
      )
      .sort((a, b) => a.ordem - b.ordem);

    const resultado = generateMockAnalysis(reuniao, prioridadesAtivas);

    // Se já havia minuta em revisão, substitui com a nova análise
    if (existingAta) {
      state.atas = state.atas.filter((a) => a.id !== existingAta.id);
    }

    const ataId = state.nextIds.ata++;
    const alteracoes: AlteracaoPrioridade[] = resultado.propostas.map((p) => ({
      ...p,
      id: state.nextIds.alteracao++,
      ataId,
    }));

    const novaAta: Ata = {
      id: ataId,
      reuniaoId: reuniao.id,
      reuniaoTitulo: reuniao.titulo,
      escolaId: reuniao.escolaId,
      anoReferencia: reuniao.anoReferencia,
      texto: resultado.textoAta,
      status: "MINUTA",
      criadaEm: nowIso(),
      aprovadaEm: null,
      aprovadaPorId: null,
      aprovadaPorNome: null,
      origemDocumento: reuniao.tipoConteudo,
      alteracoes,
    };

    state.atas.push(novaAta);
    reuniao.situacaoFluxo = "EM_REVISAO";
    reuniao.erroAnaliseMensagem = null;

    this.commit(state);
    return novaAta;
  }

  async buscarAtaPorReuniao(reuniaoId: number): Promise<Ata | null> {
    const state = this.getState();
    return state.atas.find((a) => a.reuniaoId === reuniaoId) ?? null;
  }

  async buscarAtaPorId(ataId: number): Promise<Ata> {
    const state = this.getState();
    const ata = state.atas.find((a) => a.id === ataId);
    if (!ata) {
      throw new DataProviderError(`Ata não encontrada: ${ataId}`, 404);
    }
    return ata;
  }

  async listarAtasConfirmadas(
    escolaId: number,
    ano?: number
  ): Promise<HistoricoDecisaoGrupo[]> {
    const state = this.getState();
    const grupos: HistoricoDecisaoGrupo[] = [];

    for (const ata of state.atas) {
      if (ata.status !== "APROVADA" || ata.escolaId !== escolaId) continue;
      if (ano != null && ata.anoReferencia !== ano) continue;
      const reuniao = state.reunioes.find((r) => r.id === ata.reuniaoId);
      if (!reuniao) continue;

      const qtd = ata.alteracoes.length;
      const resumoCurto =
        qtd === 1
          ? `Confirmada por ${ata.aprovadaPorNome ?? "Direção"} · 1 alteração aplicada.`
          : `Confirmada por ${ata.aprovadaPorNome ?? "Direção"} · ${qtd} alterações aplicadas`;

      grupos.push({ ata, reuniao, resumoCurto });
    }

    return grupos.sort(
      (a, b) =>
        b.reuniao.dataReuniao.localeCompare(a.reuniao.dataReuniao) ||
        b.ata.id - a.ata.id
    );
  }

  async atualizarTextoAta(ataId: number, texto: string): Promise<Ata> {
    const state = this.getState();
    const ata = state.atas.find((a) => a.id === ataId);
    if (!ata) {
      throw new DataProviderError(`Ata não encontrada: ${ataId}`, 404);
    }
    if (ata.status === "APROVADA") {
      throw new DataProviderError("Ata já aprovada não pode ser alterada.", 422);
    }
    if (!texto.trim()) {
      throw new DataProviderError("Texto da minuta é obrigatório.", 422);
    }

    ata.texto = texto.trim();
    this.commit(state);
    return ata;
  }

  async adicionarAlteracao(
    ataId: number,
    input: AlteracaoPrioridadeInput
  ): Promise<AlteracaoPrioridade> {
    const state = this.getState();
    const ata = state.atas.find((a) => a.id === ataId);
    if (!ata) throw new DataProviderError(`Ata não encontrada: ${ataId}`, 404);
    if (ata.status === "APROVADA") {
      throw new DataProviderError("Ata já aprovada não aceita novas propostas.", 422);
    }

    this.validarProposta(state, ata, input);

    const nova: AlteracaoPrioridade = {
      id: state.nextIds.alteracao++,
      ataId,
      prioridadeId: input.operacao === "INCLUIR" ? null : input.prioridadeId,
      operacao: input.operacao,
      descricaoProposta: input.descricaoProposta?.trim() || null,
      ordemProposta: input.ordemProposta,
      justificativa: input.justificativa?.trim() || null,
      trechoOrigem: input.trechoOrigem?.trim() || null,
    };

    ata.alteracoes.push(nova);
    this.commit(state);
    return nova;
  }

  async atualizarAlteracao(
    ataId: number,
    alteracaoId: number,
    input: AlteracaoPrioridadeInput
  ): Promise<AlteracaoPrioridade> {
    const state = this.getState();
    const ata = state.atas.find((a) => a.id === ataId);
    if (!ata) throw new DataProviderError(`Ata não encontrada: ${ataId}`, 404);
    if (ata.status === "APROVADA") {
      throw new DataProviderError("Ata já aprovada não pode ser alterada.", 422);
    }

    const alteracao = ata.alteracoes.find((a) => a.id === alteracaoId);
    if (!alteracao) {
      throw new DataProviderError(`Proposta não encontrada: ${alteracaoId}`, 404);
    }

    this.validarProposta(state, ata, input);

    alteracao.operacao = input.operacao;
    alteracao.prioridadeId = input.operacao === "INCLUIR" ? null : input.prioridadeId;
    alteracao.descricaoProposta = input.descricaoProposta?.trim() || null;
    alteracao.ordemProposta = input.ordemProposta;
    alteracao.justificativa = input.justificativa?.trim() || null;
    alteracao.trechoOrigem = input.trechoOrigem?.trim() || null;

    this.commit(state);
    return alteracao;
  }

  async removerAlteracao(ataId: number, alteracaoId: number): Promise<void> {
    const state = this.getState();
    const ata = state.atas.find((a) => a.id === ataId);
    if (!ata) throw new DataProviderError(`Ata não encontrada: ${ataId}`, 404);
    if (ata.status === "APROVADA") {
      throw new DataProviderError("Ata já aprovada não pode ser alterada.", 422);
    }

    ata.alteracoes = ata.alteracoes.filter((a) => a.id !== alteracaoId);
    this.commit(state);
  }

  async confirmarAta(ataId: number, diretorId: number): Promise<Ata> {
    const state = this.getState();
    const ata = state.atas.find((a) => a.id === ataId);
    if (!ata) throw new DataProviderError(`Ata não encontrada: ${ataId}`, 404);
    if (ata.status === "APROVADA") {
      throw new DataProviderError("Esta ata já foi confirmada anteriormente.", 422);
    }

    const reuniao = state.reunioes.find((r) => r.id === ata.reuniaoId);
    if (!reuniao) {
      throw new DataProviderError("Reunião de origem não encontrada.", 404);
    }

    const diretor = state.usuarios.find((u) => u.id === diretorId);
    if (!diretor || !diretor.ativo) {
      throw new DataProviderError("Usuário aprovador inválido ou inativo.", 422);
    }
    if (diretor.tipo !== "DIRETOR") {
      throw new DataProviderError(
        "Somente o diretor da escola pode confirmar a ata e aplicar alterações.",
        403
      );
    }
    if (diretor.escolaId !== reuniao.escolaId) {
      throw new DataProviderError(
        "O diretor aprovador deve pertencer à escola da reunião.",
        403
      );
    }

    const escola = state.escolas.find((e) => e.id === reuniao.escolaId);
    if (!escola) {
      throw new DataProviderError("Escola não encontrada.", 404);
    }

    let proximaOrdem =
      state.prioridades
        .filter(
          (p) =>
            p.escolaId === reuniao.escolaId &&
            p.anoReferencia === reuniao.anoReferencia &&
            p.ativa
        )
        .reduce((max, p) => Math.max(max, p.ordem), 0) + 1;

    for (const alt of ata.alteracoes) {
      if (alt.operacao === "INCLUIR") {
        const descricao = alt.descricaoProposta?.trim();
        if (!descricao) {
          throw new DataProviderError("Proposta INCLUIR exige descrição.", 422);
        }
        const ordem = alt.ordemProposta ?? proximaOrdem++;
        const novaPrioridade: PrioridadeAnual = {
          id: state.nextIds.prioridade++,
          escolaId: escola.id,
          escolaNome: escola.nome,
          anoReferencia: reuniao.anoReferencia,
          descricao,
          ordem,
          ativa: true,
          ultimaDecisaoEm: reuniao.dataReuniao,
          ultimaAtaId: ata.id,
        };
        state.prioridades.push(novaPrioridade);
        alt.prioridadeId = novaPrioridade.id;
        alt.efeitoResumo = `Entrou na ordem ${formatOrderTwoDigits(ordem).replace(/^0/, "")}`;
      } else if (alt.operacao === "ATUALIZAR") {
        const alvo = state.prioridades.find(
          (p) =>
            p.id === alt.prioridadeId &&
            p.escolaId === escola.id &&
            p.anoReferencia === reuniao.anoReferencia &&
            p.ativa
        );
        if (!alvo) {
          throw new DataProviderError(
            "Prioridade alvo para atualização não está ativa na lista do ano.",
            422
          );
        }
        if (alt.descricaoProposta && alt.descricaoProposta.trim().length > 0) {
          alvo.descricao = alt.descricaoProposta.trim();
        }
        if (alt.ordemProposta != null) {
          alvo.ordem = alt.ordemProposta;
        }
        alvo.ultimaDecisaoEm = reuniao.dataReuniao;
        alvo.ultimaAtaId = ata.id;
        alt.efeitoResumo = getPropostaEfeitoHistorico(alt);
      } else if (alt.operacao === "REMOVER") {
        const alvo = state.prioridades.find(
          (p) =>
            p.id === alt.prioridadeId &&
            p.escolaId === escola.id &&
            p.anoReferencia === reuniao.anoReferencia &&
            p.ativa
        );
        if (!alvo) {
          throw new DataProviderError(
            "Prioridade alvo para remoção não está ativa na lista do ano.",
            422
          );
        }
        if (!alt.descricaoProposta) {
          alt.descricaoProposta = alvo.descricao;
        }
        alvo.ativa = false;
        alvo.ultimaDecisaoEm = reuniao.dataReuniao;
        alvo.ultimaAtaId = ata.id;
        alt.efeitoResumo = "Retirada da lista vigente";
      }
    }

    ata.status = "APROVADA";
    ata.aprovadaEm = nowIso();
    ata.aprovadaPorId = diretor.id;
    ata.aprovadaPorNome = diretor.nome;
    reuniao.situacaoFluxo = "CONFIRMADA";

    this.commit(state);
    return ata;
  }

  async resetDemoState(): Promise<void> {
    resetMockState();
  }

  private validarProposta(
    state: MockDatabaseState,
    ata: Ata,
    input: AlteracaoPrioridadeInput
  ): void {
    if (input.operacao === "INCLUIR") {
      if (!input.descricaoProposta || !input.descricaoProposta.trim()) {
        throw new DataProviderError(
          "Proposta de inclusão exige descrição.",
          422
        );
      }
      return;
    }

    if (input.prioridadeId == null) {
      throw new DataProviderError(
        `Operação ${input.operacao} exige selecionar uma prioridade vigente.`,
        422
      );
    }

    const alvo = state.prioridades.find(
      (p) =>
        p.id === input.prioridadeId &&
        p.escolaId === ata.escolaId &&
        p.anoReferencia === ata.anoReferencia &&
        p.ativa
    );

    if (!alvo) {
      throw new DataProviderError(
        "A prioridade selecionada não está ativa para esta escola e ano.",
        422
      );
    }

    if (
      input.operacao === "ATUALIZAR" &&
      (!input.descricaoProposta || !input.descricaoProposta.trim()) &&
      input.ordemProposta == null
    ) {
      throw new DataProviderError(
        "Proposta de atualização exige nova descrição ou nova ordem.",
        422
      );
    }
  }
}
