"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { FieldWrapper, Input, Select } from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { formatDateBR, formatSituacaoReuniao } from "@/lib/formatters";
import type { Ata, Reuniao, SituacaoFluxoReuniao } from "@/types/domain";

function ReunioesContent() {
  const { provider, session, revision } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const excluidoTitulo = searchParams.get("excluido");

  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [atasPorReuniao, setAtasPorReuniao] = useState<Map<number, Ata>>(
    new Map()
  );
  const [busca, setBusca] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState<
    "TODAS" | SituacaoFluxoReuniao
  >("TODAS");
  const [rascunhoSelecionadoId, setRascunhoSelecionadoId] = useState<
    number | null
  >(null);
  const [loading, setLoading] = useState(true);

  const escolaId = session?.usuario.escolaId ?? null;

  useEffect(() => {
    let active = true;
    if (!escolaId) {
      Promise.resolve().then(() => {
        if (active) setLoading(false);
      });
      return () => {
        active = false;
      };
    }

    (async () => {
      try {
        const lista = await provider.listarReunioes(escolaId);
        const map = new Map<number, Ata>();
        await Promise.all(
          lista.map(async (r) => {
            const ata = await provider.buscarAtaPorReuniao(r.id);
            if (ata) map.set(r.id, ata);
          })
        );
        if (!active) return;
        setReunioes(lista);
        setAtasPorReuniao(map);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [provider, escolaId, revision]);

  const filtradas = useMemo(() => {
    return reunioes.filter((r) => {
      const matchBusca =
        !busca.trim() ||
        r.titulo.toLowerCase().includes(busca.trim().toLowerCase());
      const matchSituacao =
        situacaoFiltro === "TODAS" || r.situacaoFluxo === situacaoFiltro;
      return matchBusca && matchSituacao;
    });
  }, [reunioes, busca, situacaoFiltro]);

  const rascunhoDestaque = useMemo(() => {
    if (rascunhoSelecionadoId != null) {
      const found = filtradas.find(
        (r) =>
          r.id === rascunhoSelecionadoId && r.situacaoFluxo !== "CONFIRMADA"
      );
      if (found) return found;
    }
    return (
      filtradas.find(
        (r) =>
          r.situacaoFluxo === "RASCUNHO" || r.situacaoFluxo === "FALHA_ANALISE"
      ) ?? null
    );
  }, [filtradas, rascunhoSelecionadoId]);

  const getAcaoLink = (row: Reuniao): { label: string; href: string } => {
    switch (row.situacaoFluxo) {
      case "EM_REVISAO":
        return { label: "Revisar →", href: `/reunioes/${row.id}/revisao` };
      case "RASCUNHO":
        return { label: "Retomar →", href: `/reunioes/${row.id}/editar` };
      case "EM_ANALISE":
        return { label: "Acompanhar →", href: `/reunioes/${row.id}/analise` };
      case "FALHA_ANALISE":
        return { label: "Ver falha →", href: `/reunioes/${row.id}/analise` };
      case "CONFIRMADA": {
        const ata = atasPorReuniao.get(row.id);
        return {
          label: "Ver ata →",
          href: ata ? `/atas/${ata.id}` : "/historico",
        };
      }
    }
  };

  const columns: TableColumn<Reuniao>[] = [
    {
      key: "titulo",
      header: "Reunião",
      render: (row) => (
        <span className="font-medium text-[var(--atai-navy)]">{row.titulo}</span>
      ),
    },
    {
      key: "data",
      header: "Data",
      widthClass: "w-[140px]",
      render: (row) => <span>{formatDateBR(row.dataReuniao)}</span>,
    },
    {
      key: "ano",
      header: "Ano",
      widthClass: "w-[96px]",
      render: (row) => <span>{row.anoReferencia}</span>,
    },
    {
      key: "situacao",
      header: "Situação",
      widthClass: "w-[170px]",
      render: (row) => (
        <span
          className={
            row.situacaoFluxo === "FALHA_ANALISE"
              ? "font-medium text-[var(--atai-red)]"
              : row.situacaoFluxo === "CONFIRMADA"
              ? "text-[var(--atai-green)] font-medium"
              : "text-[var(--atai-navy)]"
          }
        >
          {formatSituacaoReuniao(row.situacaoFluxo)}
        </span>
      ),
    },
    {
      key: "acao",
      header: "Ação",
      widthClass: "w-[160px]",
      render: (row) => {
        const acao = getAcaoLink(row);
        return (
          <Link
            href={acao.href}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-[var(--atai-blue)] hover:underline"
          >
            {acao.label}
          </Link>
        );
      },
    },
  ];

  if (excluidoTitulo) {
    return (
      <AppShell breadcrumb="Minha escola / Reuniões e rascunhos">
        <PageHeader
          title="Reuniões e rascunhos"
          subtitle="O rascunho foi excluído. As decisões confirmadas foram preservadas."
        />
        <Banner variant="success">
          Rascunho “{excluidoTitulo}” excluído.
        </Banner>
        <div>
          <Button
            variant="primary"
            onClick={() => router.replace("/reunioes")}
          >
            Voltar à lista de reuniões
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell breadcrumb="Minha escola / Reuniões e rascunhos">
      <PageHeader
        title="Reuniões e rascunhos"
        subtitle="Retome registros pendentes e acompanhe as análises da escola."
      />

      <div className="flex flex-wrap items-end gap-4">
        <FieldWrapper
          label="Buscar reunião"
          htmlFor="busca-reuniao"
          className="min-w-[240px] flex-1"
        >
          <Input
            id="busca-reuniao"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Título da reunião"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Situação"
          htmlFor="filtro-situacao"
          className="w-[200px]"
        >
          <Select
            id="filtro-situacao"
            value={situacaoFiltro}
            onChange={(e) =>
              setSituacaoFiltro(
                e.target.value as "TODAS" | SituacaoFluxoReuniao
              )
            }
          >
            <option value="TODAS">Todas</option>
            <option value="EM_REVISAO">Em revisão</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="EM_ANALISE">Em análise</option>
            <option value="FALHA_ANALISE">Falha na análise</option>
            <option value="CONFIRMADA">Confirmada</option>
          </Select>
        </FieldWrapper>

        <LinkButton href="/reunioes/nova" variant="primary">
          Registrar reunião
        </LinkButton>
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando reuniões…
          </p>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={filtradas}
            rowKey={(row) => row.id}
            emptyMessage="Nenhuma reunião encontrada para os filtros aplicados."
            onRowClick={(row) => {
              if (row.situacaoFluxo !== "CONFIRMADA") {
                setRascunhoSelecionadoId(row.id);
              } else {
                const ata = atasPorReuniao.get(row.id);
                router.push(ata ? `/atas/${ata.id}` : "/historico");
              }
            }}
          />

          {rascunhoDestaque ? (
            <Card className="flex flex-col gap-3">
              <h2 className="text-[18px] font-semibold text-[var(--atai-navy)]">
                {rascunhoDestaque.titulo}
              </h2>
              <p className="text-[14px] text-[var(--atai-muted)]">
                {formatSituacaoReuniao(rascunhoDestaque.situacaoFluxo)} · Ainda não
                altera as prioridades da escola.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <LinkButton
                  href={
                    rascunhoDestaque.situacaoFluxo === "EM_REVISAO"
                      ? `/reunioes/${rascunhoDestaque.id}/revisao`
                      : `/reunioes/${rascunhoDestaque.id}/editar`
                  }
                  variant="primary"
                >
                  Retomar registro
                </LinkButton>
                <LinkButton
                  href={`/reunioes/${rascunhoDestaque.id}/excluir`}
                  variant="secondary"
                >
                  Excluir rascunho
                </LinkButton>
              </div>
            </Card>
          ) : null}

          <p className="text-[13px] text-[var(--atai-muted)]">
            {filtradas.length}{" "}
            {filtradas.length === 1
              ? "reunião encontrada"
              : "reuniões encontradas"}
          </p>
        </>
      )}
    </AppShell>
  );
}

export default function ReunioesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
          Carregando reuniões…
        </div>
      }
    >
      <ReunioesContent />
    </Suspense>
  );
}
