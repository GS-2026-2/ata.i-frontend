import type {
  AlteracaoPrioridade,
  OperacaoPrioridade,
  PrioridadeAnual,
  SituacaoFluxoReuniao,
  TipoConteudoReuniao,
  TipoUsuario,
} from "@/types/domain";

const MONTHS_SHORT = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

function parseDateParts(isoOrDate: string): { year: string; month: number; day: string; hours: string; minutes: string } | null {
  if (!isoOrDate) return null;
  // Support YYYY-MM-DD directly without timezone shift
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoOrDate.trim());
  if (dateOnlyMatch) {
    return {
      year: dateOnlyMatch[1],
      month: Number(dateOnlyMatch[2]),
      day: dateOnlyMatch[3],
      hours: "00",
      minutes: "00",
    };
  }
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: String(d.getFullYear()),
    month: d.getMonth() + 1,
    day: String(d.getDate()).padStart(2, "0"),
    hours: String(d.getHours()).padStart(2, "0"),
    minutes: String(d.getMinutes()).padStart(2, "0"),
  };
}

/** 2026-11-13 -> 13/11/2026 */
export function formatDateBR(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "—";
  const parts = parseDateParts(isoOrDate);
  if (!parts) return "—";
  return `${parts.day}/${String(parts.month).padStart(2, "0")}/${parts.year}`;
}

/** 2026-11-13 -> 13 nov 2026 */
export function formatDateShortMonth(isoOrDate: string | null | undefined): string {
  if (!isoOrDate) return "—";
  const parts = parseDateParts(isoOrDate);
  if (!parts) return "—";
  const monthLabel = MONTHS_SHORT[parts.month - 1] ?? "";
  return `${parts.day} ${monthLabel} ${parts.year}`;
}

/** 2026-11-13 -> 13 NOV 2026 */
export function formatDateBadgeUpper(isoOrDate: string | null | undefined): string {
  return formatDateShortMonth(isoOrDate).toUpperCase();
}

/** 2026-11-13T15:42:00-03:00 -> 13/11/2026 às 15h42 */
export function formatDateTimeBR(iso: string | null | undefined): string {
  if (!iso) return "—";
  const parts = parseDateParts(iso);
  if (!parts) return "—";
  return `${parts.day}/${String(parts.month).padStart(2, "0")}/${parts.year} às ${parts.hours}h${parts.minutes}`;
}

/** 1 -> 01 */
export function formatOrderTwoDigits(ordem: number): string {
  return String(ordem).padStart(2, "0");
}

export function formatTipoUsuario(tipo: TipoUsuario): string {
  switch (tipo) {
    case "SUPERADMIN":
      return "Superadmin";
    case "DIRETOR":
      return "Diretor";
    case "COORDENADOR":
      return "Coordenador";
    case "PROFESSOR":
      return "Professor";
  }
}

export function formatOperacao(op: OperacaoPrioridade): string {
  switch (op) {
    case "INCLUIR":
      return "Incluir";
    case "ATUALIZAR":
      return "Atualizar";
    case "REMOVER":
      return "Remover";
  }
}

export function formatSituacaoReuniao(situacao: SituacaoFluxoReuniao): string {
  switch (situacao) {
    case "RASCUNHO":
      return "Rascunho";
    case "EM_ANALISE":
      return "Em análise";
    case "EM_REVISAO":
      return "Em revisão";
    case "FALHA_ANALISE":
      return "Falha na análise";
    case "CONFIRMADA":
      return "Confirmada";
  }
}

export function formatTipoConteudo(tipo: TipoConteudoReuniao): string {
  return tipo === "TRANSCRICAO" ? "transcrição de reunião" : "ata pronta enviada";
}

export function getPropostaTitulo(
  alteracao: AlteracaoPrioridade,
  prioridadesMap: Map<number, PrioridadeAnual>
): string {
  if (alteracao.descricaoProposta && alteracao.descricaoProposta.trim().length > 0) {
    return alteracao.descricaoProposta;
  }
  if (alteracao.prioridadeId != null) {
    const alvo = prioridadesMap.get(alteracao.prioridadeId);
    if (alvo) return alvo.descricao;
  }
  return "Prioridade referenciada";
}

export function getPropostaSubtituloRevisao(
  alteracao: AlteracaoPrioridade,
  prioridadesMap: Map<number, PrioridadeAnual>
): string {
  const alvo = alteracao.prioridadeId != null ? prioridadesMap.get(alteracao.prioridadeId) : undefined;
  switch (alteracao.operacao) {
    case "INCLUIR":
      return alteracao.ordemProposta != null
        ? `Nova prioridade · Ordem ${alteracao.ordemProposta}`
        : "Nova prioridade";
    case "ATUALIZAR": {
      const ordemFinal = alteracao.ordemProposta ?? alvo?.ordem;
      if (alvo && ordemFinal === alvo.ordem) {
        return `Descrição detalhada · Ordem ${ordemFinal} mantida`;
      }
      return ordemFinal != null
        ? `Alteração de conteúdo · Ordem ${ordemFinal}`
        : "Alteração de conteúdo";
    }
    case "REMOVER":
      return "Sai da lista vigente; permanece no histórico";
  }
}

export function getPropostaEfeitoHistorico(alteracao: AlteracaoPrioridade): string {
  if (alteracao.efeitoResumo) return alteracao.efeitoResumo;
  switch (alteracao.operacao) {
    case "INCLUIR":
      return alteracao.ordemProposta != null
        ? `Entrou na ordem ${alteracao.ordemProposta}`
        : "Incluída na lista vigente";
    case "ATUALIZAR":
      return alteracao.ordemProposta != null
        ? `Ordem ${alteracao.ordemProposta} / descrição atualizada`
        : "Descrição atualizada";
    case "REMOVER":
      return "Retirada da lista vigente";
  }
}

export function getPropostaResultadoConfirmacao(alteracao: AlteracaoPrioridade): string {
  switch (alteracao.operacao) {
    case "INCLUIR":
      return alteracao.ordemProposta != null ? `Ordem ${alteracao.ordemProposta}` : "Nova prioridade";
    case "ATUALIZAR":
      return "Descrição atualizada";
    case "REMOVER":
      return "Preservada no histórico";
  }
}

export function getOperacaoResumoLabel(alteracao: AlteracaoPrioridade): string {
  switch (alteracao.operacao) {
    case "INCLUIR":
      return "+ Incluída";
    case "ATUALIZAR":
      return "↻ Atualizada";
    case "REMOVER":
      return "− Removida";
  }
}
