"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { ReuniaoForm } from "@/components/reunioes/ReuniaoForm";

function NovaReuniaoContent() {
  const searchParams = useSearchParams();
  const anoParam = Number(searchParams.get("ano"));
  const defaultAno =
    Number.isFinite(anoParam) && anoParam >= 2000 && anoParam <= 2100
      ? anoParam
      : 2026;

  return (
    <AppShell breadcrumb="Minha escola / Registrar reunião">
      <PageHeader title="Registrar reunião" />
      <ReuniaoForm defaultAno={defaultAno} />
    </AppShell>
  );
}

export default function NovaReuniaoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
          Carregando formulário…
        </div>
      }
    >
      <NovaReuniaoContent />
    </Suspense>
  );
}
