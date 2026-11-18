"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge, Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import type { Reuniao } from "@/types/domain";

function AnaliseContent() {
  const params = useParams<{ id: string }>();
  const reuniaoId = Number(params.id);
  const searchParams = useSearchParams();
  const falhaParam = searchParams.get("falha") === "1";
  const { provider, notifyMutation } = useApp();
  const router = useRouter();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [falhou, setFalhou] = useState(falhaParam);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    let active = true;
    provider
      .buscarReuniaoPorId(reuniaoId)
      .then((data) => {
        if (!active) return;
        setReuniao(data);
        if (falhaParam || data.situacaoFluxo === "FALHA_ANALISE") {
          setFalhou(true);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, reuniaoId, falhaParam]);

  const handleVerResultado = async () => {
    if (!reuniao) return;
    setProcessing(true);
    try {
      await provider.analisarReuniao(reuniao.id);
      notifyMutation();
      router.push(`/reunioes/${reuniao.id}/revisao`);
    } catch {
      const updated = await provider.buscarReuniaoPorId(reuniao.id);
      setReuniao(updated);
      setFalhou(true);
      notifyMutation();
    } finally {
      setProcessing(false);
    }
  };

  const handleSimularFalha = async () => {
    if (!reuniao) return;
    setProcessing(true);
    try {
      await provider.analisarReuniao(reuniao.id, { simulateFailure: true });
    } catch {
      const updated = await provider.buscarReuniaoPorId(reuniao.id);
      setReuniao(updated);
      setFalhou(true);
      notifyMutation();
    } finally {
      setProcessing(false);
    }
  };

  const handleTentarNovamente = async () => {
    if (!reuniao) return;
    setFalhou(false);
    setProcessing(true);
    try {
      await provider.analisarReuniao(reuniao.id);
      notifyMutation();
      router.push(`/reunioes/${reuniao.id}/revisao`);
    } catch {
      setFalhou(true);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <AppShell breadcrumb="Minha escola / Análise em andamento">
        <PageHeader title="Análise em andamento" />
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">Carregando…</p>
        </Card>
      </AppShell>
    );
  }

  if (!reuniao) {
    return (
      <AppShell breadcrumb="Minha escola / Análise">
        <PageHeader title="Reunião não encontrada" />
        <Banner variant="error">Não foi possível localizar esta reunião.</Banner>
        <div>
          <LinkButton href="/reunioes" variant="secondary">
            Voltar às reuniões
          </LinkButton>
        </div>
      </AppShell>
    );
  }

  if (falhou) {
    return (
      <AppShell breadcrumb="Minha escola / Não foi possível concluir a análise">
        <PageHeader
          title="Não foi possível concluir a análise"
          subtitle="Seu conteúdo foi preservado. Nenhuma prioridade foi alterada."
        />

        <Card className="flex flex-col items-start gap-4 p-7">
          <Badge variant="danger">FALHA NA ANÁLISE</Badge>
          <h2 className="text-[24px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
            Tente novamente em instantes
          </h2>
          <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)]">
            Se o erro continuar, revise o conteúdo enviado e tente novamente.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              variant="primary"
              onClick={handleTentarNovamente}
              disabled={processing}
            >
              {processing ? "Analisando…" : "Tentar novamente"}
            </Button>
            <LinkButton
              href={`/reunioes/${reuniao.id}/editar`}
              variant="secondary"
            >
              Editar conteúdo
            </LinkButton>
          </div>
        </Card>
      </AppShell>
    );
  }

  const isAtaPronta = reuniao.tipoConteudo === "ATA_PRONTA";

  return (
    <AppShell breadcrumb="Minha escola / Análise em andamento">
      <PageHeader
        title="Análise em andamento"
        subtitle={`${reuniao.titulo} · Conteúdo salvo`}
      />

      <Card className="flex flex-col items-start gap-5 p-7">
        <Badge variant="info">EM ANDAMENTO</Badge>

        <h2 className="text-[26px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
          {isAtaPronta
            ? "Extraindo decisões da ata…"
            : "Preparando minuta e propostas…"}
        </h2>

        <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)]">
          Você pode sair desta tela e retomar pela lista de reuniões.
        </p>

        <ol className="flex flex-col gap-2 text-[15px] leading-[1.5] text-[var(--atai-navy)]">
          <li>1 &nbsp;Conteúdo recebido</li>
          <li className="font-semibold text-[var(--atai-blue)]">
            2 &nbsp;Análise em andamento
          </li>
          <li className="text-[var(--atai-muted)]">
            3 &nbsp;Revisão pelo responsável
          </li>
        </ol>

        <Banner variant="info">
          A análise não altera as prioridades. A confirmação do diretor continua necessária.
        </Banner>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <LinkButton href="/reunioes" variant="secondary">
            Voltar às reuniões
          </LinkButton>
          <Button
            variant="primary"
            onClick={handleVerResultado}
            disabled={processing}
          >
            {processing ? "Processando…" : "Ver resultado da demonstração"}
          </Button>
          <Button
            variant="ghost"
            onClick={handleSimularFalha}
            disabled={processing}
          >
            Simular falha na análise
          </Button>
        </div>
      </Card>
    </AppShell>
  );
}

export default function AnalisePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
          Carregando análise…
        </div>
      }
    >
      <AnaliseContent />
    </Suspense>
  );
}
