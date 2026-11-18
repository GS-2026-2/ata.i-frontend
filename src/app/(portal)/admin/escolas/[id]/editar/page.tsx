"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EscolaForm } from "@/components/admin/EscolaForm";
import { LinkButton } from "@/components/ui/Button";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import type { Escola } from "@/types/domain";

export default function EditarEscolaPage() {
  const params = useParams<{ id: string }>();
  const escolaId = Number(params.id);
  const { provider } = useApp();

  const [escola, setEscola] = useState<Escola | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    provider
      .buscarEscolaPorId(escolaId)
      .then((data) => {
        if (active) setEscola(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Escola não encontrada."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, escolaId]);

  return (
    <AppShell breadcrumb="Administração / Editar escola">
      <PageHeader
        title="Editar escola"
        subtitle={
          escola ? `Administração / Escolas / ${escola.nome}` : undefined
        }
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando dados da escola…
          </p>
        </Card>
      ) : error || !escola ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Escola não encontrada."}</Banner>
          <div>
            <LinkButton href="/admin/escolas" variant="secondary">
              Voltar às escolas
            </LinkButton>
          </div>
        </div>
      ) : (
        <EscolaForm initialEscola={escola} />
      )}
    </AppShell>
  );
}
