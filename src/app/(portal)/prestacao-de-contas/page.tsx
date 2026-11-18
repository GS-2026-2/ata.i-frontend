"use client";

import React, { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { FieldWrapper, Select } from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import type { PrioridadeAnual } from "@/types/domain";

interface PrestacaoRow {
  id: number;
  prioridade: string;
  despesaPrevista: string;
  comprovante: string;
  situacao: string;
}

export default function PrestacaoDeContasPage() {
  const { provider, session, revision } = useApp();
  const [ano, setAno] = useState(2026);
  const [prioridades, setPrioridades] = useState<PrioridadeAnual[]>([]);
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
      .listarPrioridades(escolaId, ano)
      .then((lista) => {
        if (active) setPrioridades(lista);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, escolaId, ano, revision]);

  const rows: PrestacaoRow[] = prioridades.map((p) => ({
    id: p.id,
    prioridade: p.descricao,
    despesaPrevista: "A vincular",
    comprovante: "A anexar",
    situacao: "Pendente",
  }));

  const columns: TableColumn<PrestacaoRow>[] = [
    {
      key: "prioridade",
      header: "Prioridade",
      render: (row) => (
        <span className="font-medium text-[var(--atai-navy)]">
          {row.prioridade}
        </span>
      ),
    },
    {
      key: "despesaPrevista",
      header: "Despesa prevista",
      widthClass: "w-[180px]",
      render: (row) => (
        <span className="text-[var(--atai-muted)]">{row.despesaPrevista}</span>
      ),
    },
    {
      key: "comprovante",
      header: "Comprovante",
      widthClass: "w-[160px]",
      render: (row) => (
        <span className="text-[var(--atai-muted)]">{row.comprovante}</span>
      ),
    },
    {
      key: "situacao",
      header: "Situação",
      widthClass: "w-[140px]",
      render: (row) => (
        <span className="text-[var(--atai-muted)]">{row.situacao}</span>
      ),
    },
  ];

  return (
    <AppShell breadcrumb="Minha escola / Prestação de contas">
      <PageHeader
        title="Prestação de contas"
        subtitle="Conceito de evolução · Fora do fluxo funcional do primeiro MVP."
      />

      <Banner variant="info">
        PROPOSTA FUTURA · Fonte dos dados, comprovantes e modelo de exportação ainda precisam ser definidos.
      </Banner>

      <FieldWrapper
        label="Ano de referência"
        htmlFor="pc-ano"
        className="w-[200px]"
      >
        <Select
          id="pc-ano"
          value={ano}
          onChange={(e) => {
            setLoading(true);
            setAno(Number(e.target.value));
          }}
        >
          <option value={2026}>2026</option>
          <option value={2027}>2027</option>
          <option value={2025}>2025</option>
        </Select>
      </FieldWrapper>

      <Card className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-[22px] font-semibold text-[var(--atai-navy)]">
            Das decisões aos comprovantes
          </h2>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Relacione cada despesa a uma prioridade e mantenha a justificativa disponível para consulta.
          </p>
        </div>

        {loading ? (
          <p className="text-[14px] text-[var(--atai-muted)]">Carregando…</p>
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(row) => row.id}
            emptyMessage={`Nenhuma prioridade confirmada para vincular em ${ano}.`}
          />
        )}

        <div className="flex flex-col gap-1 pt-2">
          <h3 className="text-[16px] font-semibold text-[var(--atai-navy)]">
            Exportação de planilha ou documento oficial
          </h3>
          <p className="text-[13.5px] text-[var(--atai-muted)]">
            Formato em definição. Esta tela não representa uma integração já implementada.
          </p>
        </div>
      </Card>

      <div>
        <LinkButton href="/prioridades" variant="secondary">
          Voltar às prioridades
        </LinkButton>
      </div>
    </AppShell>
  );
}
