"use client";

import React from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { getHomeRouteForRole } from "@/lib/permissions";

const FAQ_ITEMS = [
  {
    pergunta: "O que posso enviar?",
    resposta:
      "Uma transcrição para gerar minuta ou uma ata pronta para extrair decisões.",
  },
  {
    pergunta: "Quando as prioridades mudam?",
    resposta:
      "Somente depois de o diretor confirmar a ata e suas propostas.",
  },
  {
    pergunta: "Posso corrigir uma decisão aprovada?",
    resposta:
      "Registre uma nova reunião. O histórico da decisão anterior será preservado.",
  },
  {
    pergunta: "Qual é o papel do coordenador?",
    resposta:
      "Registrar reuniões e revisar documentos e propostas para o diretor.",
  },
  {
    pergunta: "Não consigo entrar",
    resposta:
      "Confira as credenciais e procure o administrador responsável pelo seu acesso.",
  },
];

export default function AjudaPage() {
  const { session } = useApp();
  const isSuperadmin = session?.usuario.tipo === "SUPERADMIN";
  const backHref = session
    ? getHomeRouteForRole(session.usuario.tipo)
    : "/login";

  return (
    <AppShell
      breadcrumb={
        isSuperadmin ? "Administração / Ajuda" : "Minha escola / Ajuda"
      }
    >
      <PageHeader
        title="Ajuda"
        subtitle="Entenda o registro de decisões e as permissões de cada perfil."
      />

      <Card className="flex flex-col gap-5">
        {FAQ_ITEMS.map((item) => (
          <div key={item.pergunta} className="flex flex-col gap-1.5">
            <h2 className="text-[18px] font-semibold leading-[1.4] text-[var(--atai-navy)]">
              {item.pergunta}
            </h2>
            <p className="text-[15px] leading-[1.5] text-[var(--atai-muted)]">
              {item.resposta}
            </p>
          </div>
        ))}
      </Card>

      <div>
        <LinkButton href={backHref} variant="primary">
          {isSuperadmin ? "Voltar à administração" : "Voltar às prioridades"}
        </LinkButton>
      </div>
    </AppShell>
  );
}
