"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { FieldWrapper, Select } from "@/components/ui/FormFields";
import { Banner, Card, KpiCard } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import {
  formatDateShortMonth,
  formatOrderTwoDigits,
} from "@/lib/formatters";
import { canRegisterMeeting, canViewAtaDetail } from "@/lib/permissions";
import type {
  HistoricoDecisaoGrupo,
  PrioridadeAnual,
  Reuniao,
} from "@/types/domain";

function PrioridadesContent() {
  const { provider, session, revision } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  const anoQuery = Number(searchParams.get("ano"));
  const ano =
    Number.isFinite(anoQuery) && anoQuery >= 2000 && anoQuery <= 2100
      ? anoQuery
      : 2026;

  const [prioridades, setPrioridades] = useState<PrioridadeAnual[]>([]);
  const [reunioes, setReunioes] = useState<Reuniao[]>([]);
  const [atasConfirmadas, setAtasConfirmadas] = useState<HistoricoDecisaoGrupo[]>(
    []
  );
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

    Promise.all([
      provider.listarPrioridades(escolaId, ano),
      provider.listarReunioes(escolaId, ano),
      provider.listarAtasConfirmadas(escolaId, ano),
    ])
      .then(([listaPrioridades, listaReunioes, listaConfirmadas]) => {
        if (!active) return;
        setPrioridades(listaPrioridades);
        setReunioes(listaReunioes);
        setAtasConfirmadas(listaConfirmadas);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [provider, escolaId, ano, revision]);

  const handleAnoChange = (novoAno: number) => {
    setLoading(true);
    router.replace(`/prioridades?ano=${novoAno}`);
  };

  const tipoUsuario = session?.usuario.tipo ?? "PROFESSOR";
  const isProfessor = tipoUsuario === "PROFESSOR";
  const podeRegistrar = canRegisterMeeting(tipoUsuario);
  const podeVerDetalheAta = canViewAtaDetail(tipoUsuario);

  const reunioesParaRevisar = useMemo(
    () => reunioes.filter((r) => r.situacaoFluxo === "EM_REVISAO").length,
    [reunioes]
  );

  const ultimaAtaConfirmada = atasConfirmadas[0] ?? null;

  const columns: TableColumn<PrioridadeAnual>[] = [
    {
      key: "ordem",
      header: "Ordem",
      widthClass: "w-[96px]",
      render: (row) => (
        <span className="font-medium text-[var(--atai-navy)]">
          {formatOrderTwoDigits(row.ordem)}
        </span>
      ),
    },
    {
      key: "descricao",
      header: "Prioridade",
      render: (row) => (
        <span className="text-[var(--atai-navy)]">{row.descricao}</span>
      ),
    },
    {
      key: "ultimaDecisaoEm",
      header: "Última decisão",
      widthClass: "w-[180px]",
      render: (row) => (
        <span className="text-[var(--atai-muted)]">
          {row.ultimaDecisaoEm ? formatDateShortMonth(row.ultimaDecisaoEm) : "—"}
        </span>
      ),
    },
    {
      key: "acao",
      header: "Ação",
      widthClass: "w-[170px]",
      render: (row) => {
        if (!podeVerDetalheAta) {
          return <span className="text-[var(--atai-muted)]">Confirmada</span>;
        }
        const destino = row.ultimaAtaId
          ? `/atas/${row.ultimaAtaId}`
          : "/historico";
        return (
          <Link
            href={destino}
            className="font-medium text-[var(--atai-blue)] hover:underline"
          >
            Ver decisão →
          </Link>
        );
      },
    },
  ];

  const isEmpty = !loading && prioridades.length === 0;

  return (
    <AppShell breadcrumb="Minha escola / Prioridades da escola">
      <PageHeader
        title="Prioridades da escola"
        subtitle={
          isEmpty
            ? "Selecione um ano para consultar as decisões confirmadas."
            : "A lista vigente reúne as decisões confirmadas para o ano."
        }
      />

      {/* Filtro de ano e CTA principal */}
      <div className="flex flex-wrap items-end gap-4">
        <FieldWrapper
          label="Ano de referência"
          htmlFor="ano-referencia"
          className="w-[200px]"
        >
          <Select
            id="ano-referencia"
            value={ano}
            onChange={(e) => handleAnoChange(Number(e.target.value))}
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2025}>2025</option>
          </Select>
        </FieldWrapper>

        {podeRegistrar && !isEmpty ? (
          <LinkButton href={`/reunioes/nova?ano=${ano}`} variant="primary">
            Registrar reunião
          </LinkButton>
        ) : null}
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando prioridades de {ano}…
          </p>
        </Card>
      ) : isEmpty ? (
        <Card className="flex flex-col items-start gap-4 p-8">
          <h2 className="text-[24px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
            Ainda não há prioridades para {ano}
          </h2>
          <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)]">
            {podeRegistrar
              ? "Registre uma reunião e confirme suas decisões para formar a primeira lista do ano."
              : "Ainda não há decisões confirmadas para este ano letivo."}
          </p>
          {podeRegistrar ? (
            <LinkButton href={`/reunioes/nova?ano=${ano}`} variant="primary">
              Registrar primeira reunião
            </LinkButton>
          ) : null}
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              value={prioridades.length}
              label="Prioridades vigentes"
            />
            <KpiCard
              value={reunioesParaRevisar}
              label={
                reunioesParaRevisar === 1 || reunioesParaRevisar === 0
                  ? "Reunião para revisar"
                  : "Reuniões para revisar"
              }
            />
            <KpiCard
              value={atasConfirmadas.length}
              label="Atas confirmadas"
            />
          </div>

          {/* Aviso contextual */}
          <Banner variant="info">
            {isProfessor ? (
              "Consulta das prioridades confirmadas. O registro e a revisão ficam com a direção e a coordenação."
            ) : reunioesParaRevisar === 0 && ultimaAtaConfirmada ? (
              <>
                Lista atualizada em{" "}
                {formatDateShortMonth(
                  ultimaAtaConfirmada.reuniao.dataReuniao
                )}{" "}
                · Consulte a ata para entender cada alteração.
              </>
            ) : (
              "As propostas só alteram esta lista depois da confirmação do diretor."
            )}
          </Banner>

          {/* Tabela anual */}
          <Card className="flex flex-col gap-4">
            <h2 className="text-[20px] font-semibold leading-[1.4] text-[var(--atai-navy)]">
              O que vem primeiro em {ano}
            </h2>
            <DataTable
              columns={columns}
              rows={prioridades}
              rowKey={(row) => row.id}
            />
          </Card>

          <p className="text-[13px] leading-[1.45] text-[var(--atai-muted)]">
            A ordem pode mudar por uma nova reunião. O histórico permanece disponível.
          </p>
        </>
      )}
    </AppShell>
  );
}

export default function PrioridadesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
          Carregando prioridades…
        </div>
      }
    >
      <PrioridadesContent />
    </Suspense>
  );
}
