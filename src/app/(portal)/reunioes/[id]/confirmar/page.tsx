"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { Badge, Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import {
  formatDateBR,
  formatDateTimeBR,
  formatOperacao,
  getPropostaResultadoConfirmacao,
  getPropostaTitulo,
} from "@/lib/formatters";
import {
  DataProviderError,
  type AlteracaoPrioridade,
  type Ata,
  type PrioridadeAnual,
  type Reuniao,
} from "@/types/domain";

export default function ConfirmarAtaPage() {
  const params = useParams<{ id: string }>();
  const reuniaoId = Number(params.id);
  const { provider, session, notifyMutation } = useApp();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [ata, setAta] = useState<Ata | null>(null);
  const [prioridades, setPrioridades] = useState<PrioridadeAnual[]>([]);
  const [ataConfirmada, setAtaConfirmada] = useState<Ata | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function carregar() {
      setLoading(true);
      try {
        const r = await provider.buscarReuniaoPorId(reuniaoId);
        const a = await provider.buscarAtaPorReuniao(reuniaoId);
        const p = await provider.listarPrioridades(r.escolaId, r.anoReferencia);
        if (!active) return;
        setReuniao(r);
        setAta(a);
        setPrioridades(p);
        if (a && a.status === "APROVADA") {
          setAtaConfirmada(a);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar os dados para confirmação."
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
  }, [provider, reuniaoId]);

  const prioridadesMap = useMemo(() => {
    const map = new Map<number, PrioridadeAnual>();
    for (const p of prioridades) map.set(p.id, p);
    return map;
  }, [prioridades]);

  const handleConfirmar = async () => {
    if (!ata || !session) return;
    setSubmitting(true);
    setError(null);
    try {
      const aprovada = await provider.confirmarAta(ata.id, session.usuario.id);
      setAtaConfirmada(aprovada);
      notifyMutation();
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível confirmar a ata."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns: TableColumn<AlteracaoPrioridade>[] = [
    {
      key: "operacao",
      header: "Operação",
      widthClass: "w-[140px]",
      render: (row) => <span>{formatOperacao(row.operacao)}</span>,
    },
    {
      key: "prioridade",
      header: "Prioridade",
      render: (row) => <span>{getPropostaTitulo(row, prioridadesMap)}</span>,
    },
    {
      key: "resultado",
      header: "Resultado",
      widthClass: "w-[220px]",
      render: (row) => (
        <span className="text-[var(--atai-muted)]">
          {getPropostaResultadoConfirmacao(row)}
        </span>
      ),
    },
  ];

  // Estado · Aprovação concluída
  if (ataConfirmada && reuniao) {
    const inclusoes = ataConfirmada.alteracoes.filter(
      (a) => a.operacao === "INCLUIR"
    ).length;
    const atualizacoes = ataConfirmada.alteracoes.filter(
      (a) => a.operacao === "ATUALIZAR"
    ).length;
    const remocoes = ataConfirmada.alteracoes.filter(
      (a) => a.operacao === "REMOVER"
    ).length;

    const resumoContagem = [
      `${inclusoes} ${inclusoes === 1 ? "inclusão" : "inclusões"}`,
      `${atualizacoes} ${atualizacoes === 1 ? "atualização" : "atualizações"}`,
      `${remocoes} ${remocoes === 1 ? "remoção" : "remoções"}`,
    ].join(" · ");

    return (
      <AppShell breadcrumb="Minha escola / Decisões registradas">
        <PageHeader
          title="Decisões registradas"
          subtitle="A ata e a lista anual foram atualizadas com sucesso."
        />

        <Card className="flex flex-col items-start gap-4 p-7">
          <Badge variant="success">CONFIRMAÇÃO CONCLUÍDA</Badge>

          <h2 className="text-[28px] font-semibold leading-[1.3] text-[var(--atai-navy)]">
            As prioridades de {ataConfirmada.anoReferencia} estão atualizadas.
          </h2>

          <div className="flex flex-col gap-1 text-[15px] leading-[1.5] text-[var(--atai-muted)]">
            <p>{resumoContagem}</p>
            <p>
              Confirmado por {ataConfirmada.aprovadaPorNome ?? session?.usuario.nome} em{" "}
              {formatDateTimeBR(ataConfirmada.aprovadaEm)}.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <LinkButton
              href={`/prioridades?ano=${ataConfirmada.anoReferencia}`}
              variant="primary"
            >
              Consultar prioridades
            </LinkButton>
            <LinkButton href={`/atas/${ataConfirmada.id}`} variant="secondary">
              Ver ata aprovada
            </LinkButton>
          </div>
        </Card>
      </AppShell>
    );
  }

  const isAtaPronta =
    reuniao?.tipoConteudo === "ATA_PRONTA" ||
    ata?.origemDocumento === "ATA_PRONTA";
  const qtdAlteracoes = ata?.alteracoes.length ?? 0;

  return (
    <AppShell breadcrumb="Minha escola / Confirmar decisões">
      <PageHeader
        title="Confirmar decisões"
        subtitle="Confira o impacto antes de atualizar a lista anual."
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando impacto da confirmação…
          </p>
        </Card>
      ) : !reuniao || !ata ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Ata não encontrada."}</Banner>
          <div>
            <LinkButton href="/reunioes" variant="secondary">
              Voltar às reuniões
            </LinkButton>
          </div>
        </div>
      ) : (
        <>
          {error ? <Banner variant="error">{error}</Banner> : null}

          <Card className="flex flex-col gap-5 p-7">
            <h2 className="text-[26px] font-semibold leading-[1.3] text-[var(--atai-navy)]">
              {isAtaPronta
                ? `Confirmar ata e aplicar ${qtdAlteracoes} ${
                    qtdAlteracoes === 1 ? "alteração" : "alterações"
                  }?`
                : `Aprovar minuta e aplicar ${qtdAlteracoes} ${
                    qtdAlteracoes === 1 ? "alteração" : "alterações"
                  }?`}
            </h2>

            <div className="flex flex-col gap-0.5 text-[14px] leading-[1.45] text-[var(--atai-muted)]">
              <p>
                {reuniao.escolaNome} · Ano {reuniao.anoReferencia}
              </p>
              <p>
                {reuniao.titulo} · {formatDateBR(reuniao.dataReuniao)}
              </p>
            </div>

            <DataTable
              columns={columns}
              rows={ata.alteracoes}
              rowKey={(row) => row.id}
              emptyMessage="Nenhuma alteração proposta nesta ata."
            />

            <Banner variant="info">
              {isAtaPronta
                ? "O documento enviado será mantido. A confirmação e as alterações serão registradas juntas."
                : "A minuta se tornará ata aprovada. A ata e as alterações serão registradas juntas."}
            </Banner>

            <p className="text-[13px] leading-[1.45] text-[var(--atai-muted)]">
              Depois da confirmação, correções nas prioridades exigem uma nova decisão registrada.
            </p>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              onClick={handleConfirmar}
              disabled={submitting}
            >
              {submitting
                ? "Confirmando…"
                : isAtaPronta
                ? "Confirmar ata e prioridades"
                : "Aprovar ata e prioridades"}
            </Button>
            <LinkButton
              href={`/reunioes/${reuniao.id}/revisao`}
              variant="secondary"
            >
              Voltar à revisão
            </LinkButton>
          </div>
        </>
      )}
    </AppShell>
  );
}
