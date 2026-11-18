"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Banner, Card } from "@/components/ui/Surface";
import { Button, LinkButton } from "@/components/ui/Button";
import { useApp } from "@/context/app-context";

const TELAS_RESUMO = [
  {
    titulo: "01 Login",
    descricao: "Credenciais e feedback. Sem cadastro público; acesso gerenciado pelo superadmin.",
  },
  {
    titulo: "02 Prioridades",
    descricao: "Ano, ordem, descrição e decisão de origem. A lista só muda após confirmação.",
  },
  {
    titulo: "03 Registrar reunião",
    descricao: "Título, data, ano e escolha exclusiva: transcrição ou ata pronta.",
  },
  {
    titulo: "04 Reuniões",
    descricao: "Busca e situação. Retomar rascunho; excluir com confirmação; abrir revisão.",
  },
  {
    titulo: "05 Revisar",
    descricao: "Minuta editável ou ata original preservada. Propostas com operação, descrição, ordem, justificativa e origem.",
  },
  {
    titulo: "06 Histórico",
    descricao: "Ano, busca, operações e atas confirmadas. Preserva múltiplas reuniões no mesmo ano.",
  },
  {
    titulo: "07 Detalhe da ata",
    descricao: "Documento confirmado, autor da confirmação e alterações vinculadas. Sem edição destrutiva.",
  },
  {
    titulo: "08–09 Escolas",
    descricao: "Lista e formulário único de cadastro/edição. Nome e situação. Exclusão não proposta.",
  },
  {
    titulo: "10–11 Usuários",
    descricao: "Nome, e-mail, perfil, situação e escola. Escola obrigatória para perfis escolares; superadmin global.",
  },
  {
    titulo: "12 Prestação de contas",
    descricao: "Conceito futuro. Despesas, comprovantes e exportação em evolução fora do fluxo do MVP.",
  },
];

const HEURISTICAS = [
  "1. Visibilidade: estados de análise, revisão e confirmação.",
  "2. Linguagem familiar: reunião, minuta, ata e prioridade.",
  "3. Controle: cancelar, voltar e salvar rascunho.",
  "4. Consistência: mesmos controles, rótulos e navegação.",
  "5. Prevenção: resumo de impacto antes de aprovar ou excluir.",
  "6. Reconhecimento: contexto de escola/ano e trecho de origem visíveis.",
  "7. Eficiência: busca, filtros e retomada de rascunhos.",
  "8. Minimalismo: uma ação principal por etapa e dados essenciais.",
  "9. Recuperação: erro com conteúdo preservado e nova tentativa.",
  "10. Ajuda: orientações junto aos campos e página de ajuda.",
];

export default function DemoPage() {
  const { provider, session, login, logout, resetDemo } = useApp();
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const runScript = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    setFeedback(null);
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  const handleFluxoDiretor = () =>
    runScript("diretor", async () => {
      await login("ana.souza@escola.edu.br", "123456");
      router.push("/prioridades");
    });

  const handleAdministracao = () =>
    runScript("admin", async () => {
      await login("marina.costa@escola.edu.br", "123456");
      router.push("/admin/escolas");
    });

  const handleCoordenador = () =>
    runScript("coordenador", async () => {
      await login("bruno.lima@escola.edu.br", "123456");
      router.push("/reunioes/1/revisao");
    });

  const handleProfessor = () =>
    runScript("professor", async () => {
      await login("carla.santos@escola.edu.br", "123456");
      router.push("/prioridades");
    });

  const handleLoginInvalido = () =>
    runScript("login-invalido", async () => {
      await logout();
      router.push("/login?demo=invalid");
    });

  const handleFalhaAnalise = () =>
    runScript("falha", async () => {
      await login("ana.souza@escola.edu.br", "123456");
      const reunioes = await provider.listarReunioes(1);
      const rascunho = reunioes.find((r) => r.situacaoFluxo !== "CONFIRMADA");
      const targetId = rascunho
        ? rascunho.id
        : (
            await provider.criarReuniao({
              escolaId: 1,
              usuarioId: 1,
              titulo: "Reunião de demonstração",
              dataReuniao: "2026-11-18",
              anoReferencia: 2026,
              tipoConteudo: "TRANSCRICAO",
              conteudo:
                "Diretora: incluir melhorias de iluminação no pátio para o próximo semestre.",
            })
          ).id;

      try {
        await provider.analisarReuniao(targetId, { simulateFailure: true });
      } catch {
        // Estado FALHA_ANALISE gravado intencionalmente para demonstração
      }
      router.push(`/reunioes/${targetId}/analise?falha=1`);
    });

  const handleListaVazia = () =>
    runScript("lista-vazia", async () => {
      await login("ana.souza@escola.edu.br", "123456");
      router.push("/prioridades?ano=2027");
    });

  const handleEvolucaoFutura = () =>
    runScript("futuro", async () => {
      await login("ana.souza@escola.edu.br", "123456");
      router.push("/prestacao-de-contas");
    });

  const handleReset = () =>
    runScript("reset", async () => {
      await resetDemo();
      setFeedback(
        "Dados de demonstração restaurados para o estado inicial no localStorage."
      );
    });

  return (
    <div className="min-h-screen bg-[var(--atai-white)] px-6 py-12 lg:px-16">
      <div className="mx-auto flex w-full max-w-[1312px] flex-col gap-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/login" className="block h-[80px] w-[240px]">
            <Image
              src="/images/logo-atai.png"
              alt="ATA.I"
              width={240}
              height={80}
              priority
              className="h-[80px] w-[240px] object-contain object-left"
            />
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            {session ? (
              <LinkButton
                href={
                  session.usuario.tipo === "SUPERADMIN"
                    ? "/admin/escolas"
                    : "/prioridades"
                }
                variant="secondary"
              >
                Voltar ao sistema ({session.usuario.nome})
              </LinkButton>
            ) : (
              <LinkButton href="/login" variant="secondary">
                Ir para o Login
              </LinkButton>
            )}
            <Button
              variant="secondary"
              onClick={handleReset}
              disabled={busy !== null}
            >
              Resetar dados demo
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-[36px] font-semibold leading-[1.3] text-[var(--atai-navy)] lg:text-[40px]">
            ATA.I — Plano de experiência e roteiros
          </h1>
          <p className="text-[16px] leading-[1.45] text-[var(--atai-muted)]">
            Protótipo interativo · Modo{" "}
            <strong className="text-[var(--atai-navy)]">
              {provider.mode === "mock"
                ? "Mock com persistência em localStorage"
                : "API Spring Boot"}
            </strong>{" "}
            · Dados fictícios para apresentação Agile / DDD
          </p>
        </div>

        {feedback ? <Banner variant="success">{feedback}</Banner> : null}

        <Card className="bg-[var(--atai-bg)]/50">
          <div className="flex flex-col gap-4">
            <h2 className="text-[22px] font-semibold text-[var(--atai-navy)]">
              Roteiros de demonstração (clique para ir direto ao cenário)
            </h2>
            <p className="text-[14px] text-[var(--atai-muted)]">
              Cada botão autentica automaticamente o perfil adequado e abre o estado correspondente do fluxo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleFluxoDiretor} disabled={busy !== null}>
                Fluxo do diretor
              </Button>
              <Button onClick={handleAdministracao} disabled={busy !== null}>
                Administração
              </Button>
              <Button onClick={handleCoordenador} disabled={busy !== null}>
                Coordenador
              </Button>
              <Button onClick={handleProfessor} disabled={busy !== null}>
                Professor
              </Button>
              <Button
                variant="secondary"
                onClick={handleLoginInvalido}
                disabled={busy !== null}
              >
                Login inválido
              </Button>
              <Button
                variant="secondary"
                onClick={handleFalhaAnalise}
                disabled={busy !== null}
              >
                Falha de análise
              </Button>
              <Button
                variant="secondary"
                onClick={handleListaVazia}
                disabled={busy !== null}
              >
                Lista vazia
              </Button>
              <Button
                variant="secondary"
                onClick={handleEvolucaoFutura}
                disabled={busy !== null}
              >
                Evolução futura
              </Button>
            </div>
          </div>
        </Card>

        <div className="flex flex-col gap-3">
          <h2 className="text-[24px] font-semibold text-[var(--atai-navy)]">
            O percurso principal
          </h2>
          <p className="text-[18px] leading-[1.45] text-[var(--atai-navy)]">
            Login → Prioridades → Registrar reunião → Análise → Revisão → Confirmação → Lista atualizada / Histórico
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {TELAS_RESUMO.map((item) => (
            <Card key={item.titulo} className="flex flex-col gap-1.5">
              <h3 className="text-[17px] font-semibold text-[var(--atai-navy)]">
                {item.titulo}
              </h3>
              <p className="text-[14px] leading-[1.45] text-[var(--atai-muted)]">
                {item.descricao}
              </p>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-[24px] font-semibold text-[var(--atai-navy)]">
            Heurísticas de Nielsen aplicadas
          </h2>
          <Card>
            <ul className="flex flex-col gap-1.5 text-[15px] leading-[1.5] text-[var(--atai-navy)]">
              {HEURISTICAS.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
