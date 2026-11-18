import { apiRequest } from "@/services/api/http-client";
import type { DataProvider } from "@/services/data-provider";
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
} from "@/types/domain";

const SESSION_STORAGE_KEY = "atai_api_session_user_id";

/**
 * Implementação preparada para conectar no ata.i-backend (Spring Boot).
 * Os endpoints de CRUD, alterações e confirmação transacional já apontam
 * para /api/* exatamente conforme o contrato Java.
 */
export class ApiDataProvider implements DataProvider {
  readonly mode = "api" as const;

  async login(email: string, _senha: string): Promise<SessionUser> {
    void _senha;
    // Enquanto o backend ainda não expõe /api/auth/login, resolve o usuário pelo e-mail em /api/usuarios.
    const usuarios = await this.listarUsuarios();
    const found = usuarios.find(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (!found || !found.ativo) {
      throw new DataProviderError(
        "E-mail ou senha incorretos. Confira os dados e tente novamente.",
        401
      );
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SESSION_STORAGE_KEY, String(found.id));
    }
    const escola =
      found.escolaId != null ? await this.buscarEscolaPorId(found.escolaId) : null;
    return { usuario: found, escola };
  }

  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }

  async getCurrentSession(): Promise<SessionUser | null> {
    if (typeof window === "undefined") return null;
    const rawId = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (!rawId) return null;
    try {
      const usuario = await this.buscarUsuarioPorId(Number(rawId));
      const escola =
        usuario.escolaId != null
          ? await this.buscarEscolaPorId(usuario.escolaId)
          : null;
      return { usuario, escola };
    } catch {
      return null;
    }
  }

  async listarEscolas(incluirInativas = true): Promise<Escola[]> {
    return apiRequest<Escola[]>(
      `/api/escolas?incluirInativas=${incluirInativas ? "true" : "false"}`
    );
  }

  async buscarEscolaPorId(id: number): Promise<Escola> {
    return apiRequest<Escola>(`/api/escolas/${id}`);
  }

  async criarEscola(input: CreateEscolaInput): Promise<Escola> {
    return apiRequest<Escola>("/api/escolas", {
      method: "POST",
      body: JSON.stringify({ nome: input.nome }),
    });
  }

  async atualizarEscola(id: number, input: UpdateEscolaInput): Promise<Escola> {
    return apiRequest<Escola>(`/api/escolas/${id}`, {
      method: "PUT",
      body: JSON.stringify({ nome: input.nome, ativa: input.ativa }),
    });
  }

  async listarUsuarios(escolaId?: number): Promise<Usuario[]> {
    const query = escolaId != null ? `?escolaId=${escolaId}` : "";
    return apiRequest<Usuario[]>(`/api/usuarios${query}`);
  }

  async buscarUsuarioPorId(id: number): Promise<Usuario> {
    return apiRequest<Usuario>(`/api/usuarios/${id}`);
  }

  async criarUsuario(input: CreateUsuarioInput): Promise<Usuario> {
    return apiRequest<Usuario>("/api/usuarios", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async atualizarUsuario(id: number, input: UpdateUsuarioInput): Promise<Usuario> {
    return apiRequest<Usuario>(`/api/usuarios/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  }

  async listarPrioridades(escolaId: number, ano: number): Promise<PrioridadeAnual[]> {
    return apiRequest<PrioridadeAnual[]>(
      `/api/prioridades?escolaId=${escolaId}&ano=${ano}`
    );
  }

  async buscarHistoricoPrioridade(
    prioridadeId: number
  ): Promise<HistoricoPrioridadeItem[]> {
    return apiRequest<HistoricoPrioridadeItem[]>(
      `/api/prioridades/${prioridadeId}/historico`
    );
  }

  async listarReunioes(escolaId: number, ano?: number): Promise<Reuniao[]> {
    const params = new URLSearchParams({ escolaId: String(escolaId) });
    if (ano != null) params.set("ano", String(ano));
    const raw = await apiRequest<
      Array<
        Omit<Reuniao, "tipoConteudo" | "situacaoFluxo"> & {
          tipoConteudo?: Reuniao["tipoConteudo"];
          situacaoFluxo?: Reuniao["situacaoFluxo"];
        }
      >
    >(`/api/reunioes?${params.toString()}`);

    const result: Reuniao[] = [];
    for (const item of raw) {
      let situacaoFluxo: Reuniao["situacaoFluxo"] = item.situacaoFluxo ?? "RASCUNHO";
      if (!item.situacaoFluxo) {
        try {
          const ata = await this.buscarAtaPorReuniao(item.id);
          if (ata) {
            situacaoFluxo = ata.status === "APROVADA" ? "CONFIRMADA" : "EM_REVISAO";
          }
        } catch {
          situacaoFluxo = "RASCUNHO";
        }
      }
      result.push({
        ...item,
        tipoConteudo: item.tipoConteudo ?? "TRANSCRICAO",
        situacaoFluxo,
      });
    }
    return result;
  }

  async buscarReuniaoPorId(id: number): Promise<Reuniao> {
    const raw = await apiRequest<Omit<Reuniao, "tipoConteudo" | "situacaoFluxo">>(
      `/api/reunioes/${id}`
    );
    const ata = await this.buscarAtaPorReuniao(id);
    return {
      ...raw,
      tipoConteudo: "TRANSCRICAO",
      situacaoFluxo: ata
        ? ata.status === "APROVADA"
          ? "CONFIRMADA"
          : "EM_REVISAO"
        : "RASCUNHO",
    };
  }

  async criarReuniao(input: CreateReuniaoInput): Promise<Reuniao> {
    const raw = await apiRequest<Omit<Reuniao, "tipoConteudo" | "situacaoFluxo">>(
      "/api/reunioes",
      {
        method: "POST",
        body: JSON.stringify({
          escolaId: input.escolaId,
          usuarioId: input.usuarioId,
          titulo: input.titulo,
          dataReuniao: input.dataReuniao,
          anoReferencia: input.anoReferencia,
          transcricao: input.conteudo,
        }),
      }
    );
    return {
      ...raw,
      tipoConteudo: input.tipoConteudo,
      situacaoFluxo: "RASCUNHO",
    };
  }

  async atualizarReuniao(id: number, input: UpdateReuniaoInput): Promise<Reuniao> {
    const raw = await apiRequest<Omit<Reuniao, "tipoConteudo" | "situacaoFluxo">>(
      `/api/reunioes/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({
          titulo: input.titulo,
          dataReuniao: input.dataReuniao,
          anoReferencia: input.anoReferencia,
          transcricao: input.conteudo,
        }),
      }
    );
    return {
      ...raw,
      tipoConteudo: input.tipoConteudo,
      situacaoFluxo: "RASCUNHO",
    };
  }

  async excluirReuniao(id: number): Promise<void> {
    await apiRequest<void>(`/api/reunioes/${id}`, { method: "DELETE" });
  }

  async analisarReuniao(reuniaoId: number): Promise<Ata> {
    const reuniao = await this.buscarReuniaoPorId(reuniaoId);
    const existing = await this.buscarAtaPorReuniao(reuniaoId);
    if (existing) return existing;

    return apiRequest<Ata>(`/api/reunioes/${reuniaoId}/ata`, {
      method: "POST",
      body: JSON.stringify({
        texto:
          reuniao.transcricao ||
          "Minuta criada a partir do registro da reunião.",
      }),
    });
  }

  async buscarAtaPorReuniao(reuniaoId: number): Promise<Ata | null> {
    try {
      return await apiRequest<Ata>(`/api/reunioes/${reuniaoId}/ata`);
    } catch (err) {
      if (err instanceof DataProviderError && err.status === 404) {
        return null;
      }
      throw err;
    }
  }

  async buscarAtaPorId(ataId: number): Promise<Ata> {
    return apiRequest<Ata>(`/api/atas/${ataId}`);
  }

  async listarAtasConfirmadas(
    escolaId: number,
    ano?: number
  ): Promise<HistoricoDecisaoGrupo[]> {
    const reunioes = await this.listarReunioes(escolaId, ano);
    const grupos: HistoricoDecisaoGrupo[] = [];
    for (const reuniao of reunioes) {
      const ata = await this.buscarAtaPorReuniao(reuniao.id);
      if (ata && ata.status === "APROVADA") {
        grupos.push({
          ata,
          reuniao,
          resumoCurto: `Confirmada por ${ata.aprovadaPorNome ?? "Direção"} · ${ata.alteracoes.length} alterações aplicadas`,
        });
      }
    }
    return grupos;
  }

  async atualizarTextoAta(ataId: number, texto: string): Promise<Ata> {
    return apiRequest<Ata>(`/api/atas/${ataId}`, {
      method: "PUT",
      body: JSON.stringify({ texto }),
    });
  }

  async adicionarAlteracao(
    ataId: number,
    input: AlteracaoPrioridadeInput
  ): Promise<AlteracaoPrioridade> {
    return apiRequest<AlteracaoPrioridade>(`/api/atas/${ataId}/alteracoes`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async atualizarAlteracao(
    ataId: number,
    alteracaoId: number,
    input: AlteracaoPrioridadeInput
  ): Promise<AlteracaoPrioridade> {
    return apiRequest<AlteracaoPrioridade>(
      `/api/atas/${ataId}/alteracoes/${alteracaoId}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      }
    );
  }

  async removerAlteracao(ataId: number, alteracaoId: number): Promise<void> {
    await apiRequest<void>(`/api/atas/${ataId}/alteracoes/${alteracaoId}`, {
      method: "DELETE",
    });
  }

  async confirmarAta(ataId: number, diretorId: number): Promise<Ata> {
    return apiRequest<Ata>(`/api/atas/${ataId}/confirmacao`, {
      method: "POST",
      body: JSON.stringify({ usuarioId: diretorId }),
    });
  }

  async resetDemoState(): Promise<void> {
    // Sem efeito no modo API
  }
}
