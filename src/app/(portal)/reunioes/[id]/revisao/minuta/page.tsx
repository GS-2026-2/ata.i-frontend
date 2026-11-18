"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { DataProviderError, type Ata, type Reuniao } from "@/types/domain";

export default function EditarMinutaPage() {
  const params = useParams<{ id: string }>();
  const reuniaoId = Number(params.id);
  const { provider, notifyMutation } = useApp();
  const router = useRouter();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [ata, setAta] = useState<Ata | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      provider.buscarReuniaoPorId(reuniaoId),
      provider.buscarAtaPorReuniao(reuniaoId),
    ])
      .then(([r, a]) => {
        if (!active) return;
        setReuniao(r);
        setAta(a);
        setTexto(a?.texto ?? "");
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Ata não encontrada.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, reuniaoId]);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ata) return;
    if (!texto.trim()) {
      setError("O texto da minuta não pode ficar vazio.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await provider.atualizarTextoAta(ata.id, texto);
      notifyMutation();
      router.push(`/reunioes/${reuniaoId}/revisao`);
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível salvar a minuta."
      );
      setSaving(false);
    }
  };

  return (
    <AppShell breadcrumb="Minha escola / Editar minuta">
      <PageHeader
        title="Editar minuta"
        subtitle={
          reuniao ? `${reuniao.titulo} · Ainda não aprovada` : undefined
        }
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando minuta…
          </p>
        </Card>
      ) : !reuniao || !ata ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Minuta não encontrada."}</Banner>
          <div>
            <LinkButton href="/reunioes" variant="secondary">
              Voltar às reuniões
            </LinkButton>
          </div>
        </div>
      ) : ata.status === "APROVADA" ||
        reuniao.tipoConteudo === "ATA_PRONTA" ||
        ata.origemDocumento === "ATA_PRONTA" ? (
        <div className="flex flex-col gap-4">
          <Banner variant="info">
            {ata.status === "APROVADA"
              ? "Atas já aprovadas não permitem edição."
              : "Atas prontas preservam o texto original enviado sem alteração."}
          </Banner>
          <div>
            <LinkButton
              href={`/reunioes/${reuniaoId}/revisao`}
              variant="secondary"
            >
              Voltar à revisão
            </LinkButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSalvar} className="flex flex-col gap-6">
          {error ? <Banner variant="error">{error}</Banner> : null}

          <Card className="flex flex-col gap-4">
            <label
              htmlFor="texto-minuta"
              className="text-[16px] font-semibold text-[var(--atai-navy)]"
            >
              Texto da minuta *
            </label>

            <Textarea
              id="texto-minuta"
              rows={9}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className="text-[16px] leading-[1.55]"
            />

            <Banner variant="info">
              Se alterar uma decisão no texto, revise também a proposta correspondente antes de confirmar.
            </Banner>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar minuta"}
            </Button>
            <LinkButton
              href={`/reunioes/${reuniaoId}/revisao`}
              variant="secondary"
            >
              Cancelar
            </LinkButton>
          </div>
        </form>
      )}
    </AppShell>
  );
}
