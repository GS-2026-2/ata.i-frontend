"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { FieldWrapper, Input, Select } from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { formatDateBR } from "@/lib/formatters";
import type { Escola } from "@/types/domain";

export default function GerenciarEscolasPage() {
  const { provider, revision } = useApp();

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [busca, setBusca] = useState("");
  const [situacaoFiltro, setSituacaoFiltro] = useState<
    "TODAS" | "ATIVA" | "INATIVA"
  >("TODAS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    provider
      .listarEscolas(true)
      .then((lista) => {
        if (active) setEscolas(lista);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, revision]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return escolas.filter((e) => {
      const matchNome = !q || e.nome.toLowerCase().includes(q);
      const matchSituacao =
        situacaoFiltro === "TODAS" ||
        (situacaoFiltro === "ATIVA" ? e.ativa : !e.ativa);
      return matchNome && matchSituacao;
    });
  }, [escolas, busca, situacaoFiltro]);

  const totalAtivas = useMemo(
    () => filtradas.filter((e) => e.ativa).length,
    [filtradas]
  );

  const columns: TableColumn<Escola>[] = [
    {
      key: "nome",
      header: "Escola",
      render: (row) => (
        <span className="font-medium text-[var(--atai-navy)]">{row.nome}</span>
      ),
    },
    {
      key: "ativa",
      header: "Situação",
      widthClass: "w-[160px]",
      render: (row) => (
        <span
          className={
            row.ativa
              ? "text-[var(--atai-navy)]"
              : "text-[var(--atai-muted)]"
          }
        >
          {row.ativa ? "Ativa" : "Inativa"}
        </span>
      ),
    },
    {
      key: "criadaEm",
      header: "Criada em",
      widthClass: "w-[180px]",
      render: (row) => <span>{formatDateBR(row.criadaEm)}</span>,
    },
    {
      key: "acao",
      header: "Ação",
      widthClass: "w-[140px]",
      render: (row) => (
        <Link
          href={`/admin/escolas/${row.id}/editar`}
          className="font-medium text-[var(--atai-blue)] hover:underline"
        >
          Editar →
        </Link>
      ),
    },
  ];

  return (
    <AppShell breadcrumb="Administração / Gerenciar escolas">
      <PageHeader
        title="Gerenciar escolas"
        subtitle="Organize as instituições com acesso ao ATA.I."
      />

      <div className="flex flex-wrap items-end gap-4">
        <FieldWrapper
          label="Buscar escola"
          htmlFor="busca-escola"
          className="min-w-[240px] flex-1"
        >
          <Input
            id="busca-escola"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome da escola"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Situação"
          htmlFor="filtro-escola-situacao"
          className="w-[180px]"
        >
          <Select
            id="filtro-escola-situacao"
            value={situacaoFiltro}
            onChange={(e) =>
              setSituacaoFiltro(
                e.target.value as "TODAS" | "ATIVA" | "INATIVA"
              )
            }
          >
            <option value="TODAS">Todas</option>
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
          </Select>
        </FieldWrapper>

        <LinkButton href="/admin/escolas/nova" variant="primary">
          Cadastrar escola
        </LinkButton>
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando escolas…
          </p>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={filtradas}
            rowKey={(row) => row.id}
            emptyMessage="Nenhuma escola encontrada."
          />

          <Banner variant="info">
            Escolas inativas mantêm seus registros históricos.
          </Banner>

          <p className="text-[13px] text-[var(--atai-muted)]">
            {filtradas.length} {filtradas.length === 1 ? "escola" : "escolas"} ·{" "}
            {totalAtivas} {totalAtivas === 1 ? "ativa" : "ativas"}
          </p>
        </>
      )}
    </AppShell>
  );
}
