"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { DataProviderError, type Reuniao } from "@/types/domain";

export default function ExcluirRascunhoPage() {
  const params = useParams<{ id: string }>();
  const reuniaoId = Number(params.id);
  const { provider, notifyMutation } = useApp();
  const router = useRouter();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

  const handleExcluir = async () => {
    if (!reuniao) return;
    setSubmitting(true);
    setError(null);
    try {
      const titulo = reuniao.titulo;
      await provider.excluirReuniao(reuniao.id);
      notifyMutation();
      router.push(`/reunioes?excluido=${encodeURIComponent(titulo)}`);
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível excluir o rascunho."
      );
      setSubmitting(false);
    }
  };

  return (
    <AppShell breadcrumb="Minha escola / Excluir rascunho">
      <PageHeader
        title="Excluir rascunho"
        subtitle={
          reuniao ? `Reuniões e rascunhos / ${reuniao.titulo}` : undefined
        }
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">Carregando…</p>
        </Card>
      ) : error || !reuniao ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Rascunho não encontrado."}</Banner>
          <div>
            <LinkButton href="/reunioes" variant="secondary">
              Voltar às reuniões
            </LinkButton>
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-start gap-4 p-7">
          <Badge variant="danger">AÇÃO DEFINITIVA</Badge>
          <h2 className="text-[24px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
            Excluir “{reuniao.titulo}”?
          </h2>
          <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)]">
            O conteúdo ainda não aprovado será excluído. As atas confirmadas e as prioridades vigentes não serão alteradas.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <LinkButton href="/reunioes" variant="primary">
              Manter rascunho
            </LinkButton>
            <Button
              variant="secondary"
              onClick={handleExcluir}
              disabled={submitting}
            >
              {submitting ? "Excluindo…" : "Excluir rascunho"}
            </Button>
          </div>
        </Card>
      )}
    </AppShell>
  );
}
