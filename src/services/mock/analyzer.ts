import { formatDateShortMonth } from "@/lib/formatters";
import type {
  AlteracaoPrioridade,
  PrioridadeAnual,
  Reuniao,
} from "@/types/domain";

function cleanSentence(line: string): string {
  return line
    .replace(/^(diretora?|coordenadora?|professora?|participante)\s*:\s*/i, "")
    .trim();
}

function findMatchingPriority(
  sentence: string,
  prioridadesAtivas: PrioridadeAnual[]
): PrioridadeAnual | undefined {
  const normalized = sentence.toLowerCase();
  const stopWords = new Set([
    "para",
    "como",
    "com",
    "sem",
    "uma",
    "das",
    "dos",
    "nos",
    "nas",
    "que",
    "ordem",
    "lista",
    "prioridade",
    "incluir",
    "atualizar",
    "remover",
    "retirar",
    "manter",
  ]);

  let bestMatch: PrioridadeAnual | undefined;
  let bestScore = 0;

  for (const prioridade of prioridadesAtivas) {
    const words = prioridade.descricao
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    const score = words.reduce((acc, word) => (normalized.includes(word) ? acc + 1 : acc), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = prioridade;
    }
  }

  return bestScore > 0 ? bestMatch : undefined;
}

function extractOrderNumber(sentence: string): number | null {
  const match = /(?:ordem|posição|lugar)\s*(\d{1,2})/i.exec(sentence);
  if (match) {
    return Number(match[1]);
  }
  if (/primeira|primeiro/i.test(sentence)) return 1;
  if (/segunda|segundo/i.test(sentence)) return 2;
  if (/terceira|terceiro/i.test(sentence)) return 3;
  return null;
}

function extractSubject(sentence: string): string {
  const cleaned = cleanSentence(sentence)
    .replace(
      /^(vamos\s+)?(incluir|adicionar|inserir|atualizar|detalhar|alterar|revisar|remover|retirar|excluir|deliberou-se)\s+(também\s+)?(a\s+|o\s+)?/i,
      ""
    )
    .replace(/\s+(na|em|como)\s+(ordem\s*\d+|primeira|segunda|terceira).*$/i, "")
    .replace(/[.]+$/, "")
    .trim();

  if (!cleaned) return "Nova prioridade registrada em reunião";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export interface GeneratedAnalysisResult {
  textoAta: string;
  propostas: Omit<AlteracaoPrioridade, "id" | "ataId">[];
}

export function generateMockAnalysis(
  reuniao: Reuniao,
  prioridadesAtivas: PrioridadeAnual[]
): GeneratedAnalysisResult {
  const rawText =
    reuniao.tipoConteudo === "ATA_PRONTA"
      ? reuniao.textoAtaEnviada || reuniao.transcricao || ""
      : reuniao.transcricao || "";

  const sentences = rawText
    .split(/\n+|(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 8);

  const propostas: Omit<AlteracaoPrioridade, "id" | "ataId">[] = [];
  let nextFallbackOrder =
    prioridadesAtivas.reduce((max, p) => Math.max(max, p.ordem), 0) + 1;

  for (const sentence of sentences) {
    const lower = sentence.toLowerCase();
    const matched = findMatchingPriority(sentence, prioridadesAtivas);
    const ordem = extractOrderNumber(sentence);

    if (/(remover|retirar|excluir|deixa a lista)/i.test(lower) && matched) {
      if (!propostas.some((p) => p.operacao === "REMOVER" && p.prioridadeId === matched.id)) {
        propostas.push({
          prioridadeId: matched.id,
          operacao: "REMOVER",
          descricaoProposta: matched.descricao,
          ordemProposta: null,
          justificativa: "Retirada sugerida conforme deliberação registrada na reunião.",
          trechoOrigem: cleanSentence(sentence),
        });
      }
      continue;
    }

    if (/(atualizar|detalhar|alterar|revisar|manter)/i.test(lower) && matched) {
      if (!propostas.some((p) => p.operacao === "ATUALIZAR" && p.prioridadeId === matched.id)) {
        propostas.push({
          prioridadeId: matched.id,
          operacao: "ATUALIZAR",
          descricaoProposta: matched.descricao,
          ordemProposta: ordem ?? matched.ordem,
          justificativa: "Escopo ou posição ajustados conforme discussão da equipe.",
          trechoOrigem: cleanSentence(sentence),
        });
      }
      continue;
    }

    if (/(incluir|adicionar|inserir|nova prioridade|priorizar|adequa)/i.test(lower)) {
      const descricao = matched ? matched.descricao : extractSubject(sentence);
      if (matched && /(atualizar|detalhar|manter|ordem)/i.test(lower)) {
        propostas.push({
          prioridadeId: matched.id,
          operacao: "ATUALIZAR",
          descricaoProposta: matched.descricao,
          ordemProposta: ordem ?? matched.ordem,
          justificativa: "Atualização de prioridade já existente na lista anual.",
          trechoOrigem: cleanSentence(sentence),
        });
      } else {
        propostas.push({
          prioridadeId: null,
          operacao: "INCLUIR",
          descricaoProposta: descricao,
          ordemProposta: ordem ?? nextFallbackOrder++,
          justificativa: "Nova prioridade proposta a partir do registro da reunião.",
          trechoOrigem: cleanSentence(sentence),
        });
      }
    }
  }

  // Garante pelo menos uma proposta coerente caso o texto não use palavras-chave padrão
  if (propostas.length === 0) {
    const primeiroTrecho = sentences[0] ? cleanSentence(sentences[0]) : rawText.trim();
    propostas.push({
      prioridadeId: null,
      operacao: "INCLUIR",
      descricaoProposta: extractSubject(primeiroTrecho),
      ordemProposta: nextFallbackOrder,
      justificativa: "Proposta extraída automaticamente para revisão da gestão escolar.",
      trechoOrigem: primeiroTrecho || "Deliberação registrada no conteúdo da reunião.",
    });
  }

  if (reuniao.tipoConteudo === "ATA_PRONTA") {
    return {
      textoAta: rawText.trim(),
      propostas,
    };
  }

  const dataExtenso = formatDateShortMonth(reuniao.dataReuniao);
  const resumoLinhas = propostas.map((p) => {
    if (p.operacao === "INCLUIR") {
      return `Foi proposta a inclusão de "${p.descricaoProposta}" na ordem ${p.ordemProposta ?? 1}.`;
    }
    if (p.operacao === "ATUALIZAR") {
      return `Ficou deliberada a atualização de "${p.descricaoProposta}" mantendo o alinhamento para ${reuniao.anoReferencia}.`;
    }
    return `Foi proposta a retirada de "${p.descricaoProposta}" da lista vigente, preservando seu registro no histórico.`;
  });

  const textoAta =
    `Em ${dataExtenso}, reuniu-se a equipe escolar (${reuniao.escolaNome}) na pauta "${reuniao.titulo}" para deliberar sobre as prioridades de ${reuniao.anoReferencia}.\n\n` +
    resumoLinhas.join("\n\n") +
    `\n\nAs alterações propostas aguardam revisão e confirmação da direção para atualizar a lista anual vigente.`;

  return {
    textoAta,
    propostas,
  };
}
