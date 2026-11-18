"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { FieldWrapper, Input, Select } from "@/components/ui/FormFields";
import { Badge, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import {
  formatDateBadgeUpper,
  formatOperacao,
  getPropostaEfeitoHistorico,
} from "@/lib/formatters";
import type {
  AlteracaoPrioridade,
  HistoricoDecisaoGrupo,
  OperacaoPrioridade,
} from "@/types/domain";

export default function HistoricoPage() {
  const { provider, session, revision } = useApp();

  const [ano, setAno] = useState<number>(2026);
  const [busca, setBusca] = useState("");
  const [operacaoFiltro, setOperacaoFiltro] = useState<
    "TODAS" | OperacaoPrioridade
  >("TODAS");
  const [grupos, setGrupos] = useState<HistoricoDecisaoGrupo[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
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

    provider
      .listarAtasConfirmadas(escolaId, ano)
      .then((lista) => {
        if (!active) return;
        setGrupos(lista);
        setExpandedIds(lista[0] ? new Set([lista[0].ata.id]) : new Set());
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, escolaId, ano, revision]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return grupos
      .map((grupo) => {
        const tituloMatch = !q || grupo.reuniao.titulo.toLowerCase().includes(q);
        const alteracoesFiltradas = grupo.ata.alteracoes.filter((alt) => {
          const matchOp =
            operacaoFiltro === "TODAS" || alt.operacao === operacaoFiltro;
          const matchTexto =
            !q ||
            tituloMatch ||
            (alt.descricaoProposta ?? "").toLowerCase().includes(q);
          return matchOp && matchTexto;
        });

        if (alteracoesFiltradas.length === 0) {
          return null;
        }
        return {
          ...grupo,
          alteracoesExibidas: alteracoesFiltradas,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [grupos, busca, operacaoFiltro]);

  const toggleExpand = (ataId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(ataId)) {
        next.delete(ataId);
      } else {
        next.add(ataId);
      }
      return next;
    });
  };

  const columns: TableColumn<AlteracaoPrioridade>[] = [
    {
      key: "operacao",
      header: "Operação",
      widthClass: "w-[130px]",
      render: (row) => <span>{formatOperacao(row.operacao)}</span>,
    },
    {
      key: "prioridade",
      header: "Prioridade",
      render: (row) => (
        <span>{row.descricaoProposta ?? "Prioridade referenciada"}</span>
      ),
    },
    {
      key: "efeito",
      header: "Efeito",
      widthClass: "w-[260px]",
      render: (row) => (
        <span className="text-[var(--atai-muted)]">
          {getPropostaEfeitoHistorico(row)}
        </span>
      ),
    },
  ];

  const isFiltering = Boolean(busca.trim()) || operacaoFiltro !== "TODAS";

  return (
    <AppShell breadcrumb="Minha escola / Histórico de decisões">
      <PageHeader
        title="Histórico de decisões"
        subtitle="Veja quando, por quem e por qual ata cada prioridade foi alterada."
      />

      <div className="flex flex-wrap items-end gap-4">
        <FieldWrapper
          label="Ano de referência"
          htmlFor="hist-ano"
          className="w-[180px]"
        >
          <Select
            id="hist-ano"
            value={ano}
            onChange={(e) => setAno(Number(e.target.value))}
          >
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
            <option value={2025}>2025</option>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Buscar decisão"
          htmlFor="hist-busca"
          className="min-w-[260px] flex-1"
        >
          <Input
            id="hist-busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Prioridade ou título da reunião"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Operação"
          htmlFor="hist-operacao"
          className="w-[180px]"
        >
          <Select
            id="hist-operacao"
            value={operacaoFiltro}
            onChange={(e) =>
              setOperacaoFiltro(
                e.target.value as "TODAS" | OperacaoPrioridade
              )
            }
          >
            <option value="TODAS">Todas</option>
            <option value="INCLUIR">Incluir</option>
            <option value="ATUALIZAR">Atualizar</option>
            <option value="REMOVER">Remover</option>
          </Select>
        </FieldWrapper>
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando histórico de decisões…
          </p>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card className="flex flex-col gap-2">
          <h2 className="text-[20px] font-semibold text-[var(--atai-navy)]">
            Nenhuma decisão confirmada encontrada
          </h2>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Ajuste os filtros ou confirme uma ata de {ano} para iniciar a trilha histórica.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {filtrados.map((grupo, idx) => {
            const expanded = isFiltering || expandedIds.has(grupo.ata.id) || idx === 0;
            const dateBadge = formatDateBadgeUpper(grupo.reuniao.dataReuniao);

            if (!expanded) {
              return (
                <Card
                  key={grupo.ata.id}
                  className="flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <h2 className="text-[18px] font-semibold text-[var(--atai-navy)]">
                      {dateBadge} · {grupo.reuniao.titulo}
                    </h2>
                    <p className="text-[14px] text-[var(--atai-muted)]">
                      {grupo.resumoCurto}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    <Button
                      variant="secondary"
                      onClick={() => toggleExpand(grupo.ata.id)}
                    >
                      Expandir alterações
                    </Button>
                    <LinkButton
                      href={`/atas/${grupo.ata.id}`}
                      variant="secondary"
                    >
                      Consultar ata
                    </LinkButton>
                  </div>
                </Card>
              );
            }

            return (
              <Card key={grupo.ata.id} className="flex flex-col items-start gap-4">
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                  <Badge variant="info">{dateBadge}</Badge>
                  {idx > 0 && !isFiltering ? (
                    <button
                      type="button"
                      onClick={() => toggleExpand(grupo.ata.id)}
                      className="text-[13px] font-medium text-[var(--atai-muted)] hover:text-[var(--atai-navy)] cursor-pointer"
                    >
                      Recolher
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-col gap-1">
                  <h2 className="text-[22px] font-semibold text-[var(--atai-navy)]">
                    {grupo.reuniao.titulo}
                  </h2>
                  <p className="text-[14px] text-[var(--atai-muted)]">
                    {grupo.resumoCurto}
                  </p>
                </div>

                <DataTable
                  columns={columns}
                  rows={grupo.alteracoesExibidas}
                  rowKey={(row) => row.id}
                />

                <LinkButton href={`/atas/${grupo.ata.id}`} variant="secondary">
                  Consultar ata e decisões
                </LinkButton>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
