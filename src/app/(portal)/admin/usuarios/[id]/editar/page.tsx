"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { UsuarioForm } from "@/components/admin/UsuarioForm";
import { LinkButton } from "@/components/ui/Button";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import type { Usuario } from "@/types/domain";

export default function EditarUsuarioPage() {
  const params = useParams<{ id: string }>();
  const usuarioId = Number(params.id);
  const { provider } = useApp();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    provider
      .buscarUsuarioPorId(usuarioId)
      .then((data) => {
        if (active) setUsuario(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Usuário não encontrado."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, usuarioId]);

  return (
    <AppShell breadcrumb="Administração / Editar usuário">
      <PageHeader
        title="Editar usuário"
        subtitle={
          usuario ? `Administração / Usuários / ${usuario.nome}` : undefined
        }
      />

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando dados do usuário…
          </p>
        </Card>
      ) : error || !usuario ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Usuário não encontrado."}</Banner>
          <div>
            <LinkButton href="/admin/usuarios" variant="secondary">
              Voltar aos usuários
            </LinkButton>
          </div>
        </div>
      ) : (
        <UsuarioForm initialUsuario={usuario} />
      )}
    </AppShell>
  );
}
