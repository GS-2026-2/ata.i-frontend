"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ReuniaoForm } from "@/components/reunioes/ReuniaoForm";
import { LinkButton } from "@/components/ui/Button";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import type { Reuniao } from "@/types/domain";

export default function EditarReuniaoPage() {
  const params = useParams<{ id: string }>();
  const reuniaoId = Number(params.id);
  const { provider } = useApp();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    provider
      .buscarReuniaoPorId(reuniaoId)
      .then((data) => {
        if (!active) return;
        setReuniao(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Reunião não encontrada.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, reuniaoId]);

  return (
    <AppShell breadcrumb="Minha escola / Registrar reunião">
      <PageHeader title="Registrar reunião" />
      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando rascunho…
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
      ) : reuniao.situacaoFluxo === "CONFIRMADA" ? (
        <div className="flex flex-col gap-4">
          <Banner variant="info">
            Esta reunião já possui ata aprovada e não pode ser editada.
          </Banner>
          <div>
            <LinkButton href="/reunioes" variant="secondary">
              Voltar às reuniões
            </LinkButton>
          </div>
        </div>
      ) : (
        <ReuniaoForm initialReuniao={reuniao} />
      )}
    </AppShell>
  );
}
