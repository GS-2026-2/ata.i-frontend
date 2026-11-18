"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import {
  formatDateShortMonth,
  getPropostaSubtituloRevisao,
  getPropostaTitulo,
} from "@/lib/formatters";
import { canConfirmAta } from "@/lib/permissions";
import type { Ata, PrioridadeAnual, Reuniao } from "@/types/domain";

export default function RevisaoAtaPage() {
  const params = useParams<{ id: string }>();
  const reuniaoId = Number(params.id);
  const { provider, session, revision } = useApp();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [ata, setAta] = useState<Ata | null>(null);
  const [prioridades, setPrioridades] = useState<PrioridadeAnual[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const r = await provider.buscarReuniaoPorId(reuniaoId);
        const [a, p] = await Promise.all([
          provider.buscarAtaPorReuniao(reuniaoId),
          provider.listarPrioridades(r.escolaId, r.anoReferencia),
        ]);
        if (!active) return;
        setReuniao(r);
        setAta(a);
        setPrioridades(p);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar os dados da revisão."
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [provider, reuniaoId, revision]);

  const prioridadesMap = useMemo(() => {
    const map = new Map<number, PrioridadeAnual>();
    for (const p of prioridades) {
      map.set(p.id, p);
    }
    return map;
  }, [prioridades]);

  const isDiretor = session ? canConfirmAta(session.usuario.tipo) : false;
  const isAtaPronta =
    reuniao?.tipoConteudo === "ATA_PRONTA" ||
    ata?.origemDocumento === "ATA_PRONTA";
  const primeiraPropostaId = ata?.alteracoes[0]?.id;

  return (
    <AppShell breadcrumb="Minha escola / Revisar ata e propostas">
      <PageHeader
        title="Revisar ata e propostas"
        subtitle={
          reuniao
            ? `${reuniao.titulo} · ${formatDateShortMonth(
                reuniao.dataReuniao
              )} · Ano de referência ${reuniao.anoReferencia}`
            : undefined
        }
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando revisão…
          </p>
        </Card>
      ) : error || !reuniao ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Reunião não encontrada."}</Banner>
          <div>
            <LinkButton href="/reunioes" variant="secondary">
              Voltar às reuniões
            </LinkButton>
          </div>
        </div>
      ) : !ata ? (
        <Card className="flex flex-col items-start gap-4">
          <p className="text-[15px] text-[var(--atai-muted)]">
            Esta reunião ainda não possui uma ata ou minuta gerada.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href={`/reunioes/${reuniao.id}/editar`} variant="primary">
              Editar registro
            </LinkButton>
            <LinkButton href={`/reunioes/${reuniao.id}/analise`} variant="secondary">
              Ir para análise
            </LinkButton>
          </div>
        </Card>
      ) : ata.status === "APROVADA" ? (
        <div className="flex flex-col gap-4">
          <Banner variant="success">
            Esta ata já foi confirmada por {ata.aprovadaPorNome}. Alterações não são mais permitidas.
          </Banner>
          <div>
            <LinkButton href={`/atas/${ata.id}`} variant="primary">
              Ver detalhe da ata aprovada
            </LinkButton>
          </div>
        </div>
      ) : (
        <>
          <Banner variant="info">
            {!isDiretor
              ? "Você pode revisar o conteúdo. Somente o diretor da escola pode confirmar a ata e as prioridades."
              : isAtaPronta
              ? "Ata pronta em revisão · O original é preservado. Confira as propostas extraídas antes de confirmar."
              : "Minuta em revisão · Confira o texto e as propostas da IA. Nenhuma mudança foi aplicada."}
          </Banner>

          {savedNotice ? <Banner variant="success">{savedNotice}</Banner> : null}

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Coluna Esquerda: Documento (Minuta ou Ata Enviada) */}
            <Card className="flex flex-col items-start gap-4 lg:col-span-7">
              <Badge variant="info">
                {isAtaPronta ? "ATA ENVIADA" : "MINUTA"}
              </Badge>

              <h2 className="text-[22px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
                {isAtaPronta ? "Ata original enviada" : "Minuta da reunião"}
              </h2>

              <div className="flex flex-col gap-3 whitespace-pre-wrap text-[15px] leading-[1.55] text-[var(--atai-navy)]">
                {ata.texto}
              </div>

              {!isAtaPronta ? (
                <>
                  <LinkButton
                    href={`/reunioes/${reuniao.id}/revisao/minuta`}
                    variant="secondary"
                  >
                    Editar minuta
                  </LinkButton>
                  <p className="text-[12.5px] text-[var(--atai-muted)]">
                    Texto gerado por IA. Confira com a transcrição.
                  </p>
                </>
              ) : (
                <p className="text-[12.5px] text-[var(--atai-muted)]">
                  Documento original preservado. As propostas ao lado são revisáveis.
                </p>
              )}
            </Card>

            {/* Coluna Direita: Propostas de alteração */}
            <Card className="flex flex-col items-start gap-4 lg:col-span-5">
              <h2 className="text-[20px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
                {ata.alteracoes.length}{" "}
                {ata.alteracoes.length === 1
                  ? "alteração proposta"
                  : "alterações propostas"}
              </h2>

              {ata.alteracoes.length === 0 ? (
                <p className="text-[14px] leading-[1.45] text-[var(--atai-muted)]">
                  Nenhuma proposta vinculada no momento. Adicione uma proposta para atualizar a lista anual ao confirmar.
                </p>
              ) : (
                <div className="flex w-full flex-col gap-4">
                  {ata.alteracoes.map((alt) => {
                    const badgeVariant =
                      alt.operacao === "REMOVER" ? "danger" : "success";
                    return (
                      <Link
                        key={alt.id}
                        href={`/reunioes/${reuniao.id}/revisao/propostas/${alt.id}`}
                        className="group flex flex-col items-start gap-1.5 rounded-[8px] border border-transparent p-2 -mx-2 transition-colors hover:border-[var(--atai-line)] hover:bg-[var(--atai-bg)]/50"
                      >
                        <Badge variant={badgeVariant}>{alt.operacao}</Badge>
                        <p className="text-[15px] font-semibold leading-[1.4] text-[var(--atai-navy)] group-hover:text-[var(--atai-blue)]">
                          {getPropostaTitulo(alt, prioridadesMap)}
                        </p>
                        <p className="text-[13px] leading-[1.4] text-[var(--atai-muted)]">
                          {getPropostaSubtituloRevisao(alt, prioridadesMap)}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2.5 pt-2">
                {primeiraPropostaId != null ? (
                  <LinkButton
                    href={`/reunioes/${reuniao.id}/revisao/propostas/${primeiraPropostaId}`}
                    variant="secondary"
                  >
                    Revisar justificativas e trechos
                  </LinkButton>
                ) : null}
                <LinkButton
                  href={`/reunioes/${reuniao.id}/revisao/propostas/nova`}
                  variant="ghost"
                >
                  + Adicionar proposta
                </LinkButton>
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isDiretor ? (
              <LinkButton
                href={`/reunioes/${reuniao.id}/confirmar`}
                variant="primary"
              >
                Revisar confirmação
              </LinkButton>
            ) : (
              <Button
                variant="primary"
                onClick={() =>
                  setSavedNotice(
                    "Revisão salva para o diretor confirmar quando estiver pronto."
                  )
                }
              >
                Salvar para o diretor
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() =>
                setSavedNotice(
                  "Revisão salva. As prioridades continuam inalteradas até a confirmação do diretor."
                )
              }
            >
              Salvar revisão
            </Button>
          </div>
        </>
      )}
    </AppShell>
  );
}
