"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LinkButton } from "@/components/ui/Button";
import { Badge, Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import {
  formatDateBR,
  formatDateTimeBR,
  formatTipoConteudo,
  getOperacaoResumoLabel,
} from "@/lib/formatters";
import type { Ata, Reuniao } from "@/types/domain";

export default function DetalheAtaPage() {
  const params = useParams<{ id: string }>();
  const ataId = Number(params.id);
  const { provider } = useApp();

  const [ata, setAta] = useState<Ata | null>(null);
  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function carregar() {
      setLoading(true);
      try {
        const a = await provider.buscarAtaPorId(ataId);
        const r = await provider.buscarReuniaoPorId(a.reuniaoId);
        if (!active) return;
        setAta(a);
        setReuniao(r);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Ata não encontrada."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    carregar();
    return () => {
      active = false;
    };
  }, [provider, ataId]);

  return (
    <AppShell breadcrumb="Minha escola / Detalhe da ata">
      <PageHeader
        title="Detalhe da ata"
        subtitle={
          ata ? `Histórico de decisões / ${ata.reuniaoTitulo}` : undefined
        }
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando ata…
          </p>
        </Card>
      ) : error || !ata || !reuniao ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Ata não encontrada."}</Banner>
          <div>
            <LinkButton href="/historico" variant="secondary">
              Voltar ao histórico
            </LinkButton>
          </div>
        </div>
      ) : (
        <>
          {ata.status === "APROVADA" ? (
            <Banner variant="success">
              Ata confirmada em {formatDateTimeBR(ata.aprovadaEm)} por{" "}
              {ata.aprovadaPorNome ?? "Direção"}. Este registro preserva a decisão aprovada.
            </Banner>
          ) : (
            <Banner variant="info">
              Esta ata ainda está em fase de minuta e não foi confirmada.
            </Banner>
          )}

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Documento Confirmado */}
            <Card className="flex flex-col items-start gap-4 lg:col-span-7">
              <Badge variant={ata.status === "APROVADA" ? "success" : "info"}>
                {ata.status}
              </Badge>

              <h2 className="text-[24px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
                {ata.reuniaoTitulo}
              </h2>

              <div className="flex flex-col gap-0.5 text-[14px] leading-[1.45] text-[var(--atai-muted)]">
                <p>{reuniao.escolaNome}</p>
                <p>
                  Reunião: {formatDateBR(reuniao.dataReuniao)} · Referência:{" "}
                  {ata.anoReferencia}
                </p>
              </div>

              <div className="whitespace-pre-wrap text-[15.5px] leading-[1.55] text-[var(--atai-navy)]">
                {ata.texto}
              </div>
            </Card>

            {/* Rastreabilidade */}
            <Card className="flex flex-col gap-4 self-start lg:col-span-5">
              <h2 className="text-[20px] font-semibold text-[var(--atai-navy)]">
                Alterações aplicadas
              </h2>

              {ata.alteracoes.length === 0 ? (
                <p className="text-[14px] text-[var(--atai-muted)]">
                  Nenhuma alteração de prioridade registrada nesta ata.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5 text-[14px] leading-[1.45] text-[var(--atai-navy)]">
                  {ata.alteracoes.map((alt) => (
                    <li key={alt.id}>
                      {getOperacaoResumoLabel(alt)}:{" "}
                      {alt.descricaoProposta ?? "Prioridade referenciada"}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-col gap-1 border-t border-[var(--atai-line)]/70 pt-3 text-[13.5px] leading-[1.5] text-[var(--atai-muted)]">
                <p>
                  Origem:{" "}
                  {formatTipoConteudo(
                    ata.origemDocumento ?? reuniao.tipoConteudo
                  )}
                </p>
                <p>Registrada por: {reuniao.criadaPorNome}</p>
                <p>
                  Confirmada por:{" "}
                  {ata.aprovadaPorNome ?? "Aguardando confirmação"}
                </p>
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap gap-3">
            <LinkButton
              href={`/prioridades?ano=${ata.anoReferencia}`}
              variant="primary"
            >
              Ver prioridades atualizadas
            </LinkButton>
            <LinkButton href="/historico" variant="secondary">
              Voltar ao histórico
            </LinkButton>
          </div>
        </>
      )}
    </AppShell>
  );
}
