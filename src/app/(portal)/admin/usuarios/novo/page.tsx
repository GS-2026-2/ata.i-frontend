"use client";

import React from "react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { UsuarioForm } from "@/components/admin/UsuarioForm";

export default function NovoUsuarioPage() {
  return (
    <AppShell breadcrumb="Administração / Cadastrar usuário">
      <PageHeader
        title="Cadastrar usuário"
        subtitle="Administração / Usuários / Novo cadastro"
      />
      <UsuarioForm />
    </AppShell>
  );
}
