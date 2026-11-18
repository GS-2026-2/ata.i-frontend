"use client";

import React from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EscolaForm } from "@/components/admin/EscolaForm";

export default function NovaEscolaPage() {
  return (
    <AppShell breadcrumb="Administração / Cadastrar escola">
      <PageHeader
        title="Cadastrar escola"
        subtitle="Administração / Escolas / Novo cadastro"
      />
      <EscolaForm />
    </AppShell>
  );
}
