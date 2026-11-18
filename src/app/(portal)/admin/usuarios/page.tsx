"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { LinkButton } from "@/components/ui/Button";
import { DataTable, type TableColumn } from "@/components/ui/DataTable";
import { FieldWrapper, Input, Select } from "@/components/ui/FormFields";
import { Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { formatTipoUsuario } from "@/lib/formatters";
import type { Escola, TipoUsuario, Usuario } from "@/types/domain";

function formatShortSchoolName(escolaNome: string | null): string {
  if (!escolaNome) return "Acesso global";
  return escolaNome.replace(/^EMEB\s+/i, "");
}

export default function GerenciarUsuariosPage() {
  const { provider, revision } = useApp();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [busca, setBusca] = useState("");
  const [escolaFiltro, setEscolaFiltro] = useState<string>("TODAS");
  const [perfilFiltro, setPerfilFiltro] = useState<"TODOS" | TipoUsuario>(
    "TODOS"
  );
  const [situacaoFiltro, setSituacaoFiltro] = useState<
    "TODAS" | "ATIVO" | "INATIVO"
  >("TODAS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([provider.listarUsuarios(), provider.listarEscolas(true)])
      .then(([listaUsuarios, listaEscolas]) => {
        if (!active) return;
        setUsuarios(listaUsuarios);
        setEscolas(listaEscolas);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provider, revision]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return usuarios.filter((u) => {
      const matchBusca =
        !q ||
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q);
      const matchEscola =
        escolaFiltro === "TODAS" ||
        (escolaFiltro === "GLOBAL"
          ? u.escolaId === null
          : u.escolaId === Number(escolaFiltro));
      const matchPerfil = perfilFiltro === "TODOS" || u.tipo === perfilFiltro;
      const matchSituacao =
        situacaoFiltro === "TODAS" ||
        (situacaoFiltro === "ATIVO" ? u.ativo : !u.ativo);
      return matchBusca && matchEscola && matchPerfil && matchSituacao;
    });
  }, [usuarios, busca, escolaFiltro, perfilFiltro, situacaoFiltro]);

  const columns: TableColumn<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      render: (row) => (
        <span className="font-medium text-[var(--atai-navy)]">{row.nome}</span>
      ),
    },
    {
      key: "escola",
      header: "Escola",
      render: (row) => (
        <span>{formatShortSchoolName(row.escolaNome)}</span>
      ),
    },
    {
      key: "perfil",
      header: "Perfil",
      widthClass: "w-[160px]",
      render: (row) => <span>{formatTipoUsuario(row.tipo)}</span>,
    },
    {
      key: "situacao",
      header: "Situação",
      widthClass: "w-[140px]",
      render: (row) => (
        <span
          className={
            row.ativo ? "text-[var(--atai-navy)]" : "text-[var(--atai-muted)]"
          }
        >
          {row.ativo ? "Ativo" : "Inativo"}
        </span>
      ),
    },
    {
      key: "acao",
      header: "Ação",
      widthClass: "w-[130px]",
      render: (row) => (
        <Link
          href={`/admin/usuarios/${row.id}/editar`}
          className="font-medium text-[var(--atai-blue)] hover:underline"
        >
          Editar →
        </Link>
      ),
    },
  ];

  return (
    <AppShell breadcrumb="Administração / Gerenciar usuários">
      <PageHeader
        title="Gerenciar usuários"
        subtitle="Controle o acesso por escola, perfil e situação."
      />

      <div className="grid gap-4 md:grid-cols-12">
        <FieldWrapper
          label="Buscar usuário"
          htmlFor="busca-usuario"
          className="md:col-span-4"
        >
          <Input
            id="busca-usuario"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou e-mail"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Escola"
          htmlFor="filtro-usuario-escola"
          className="md:col-span-3"
        >
          <Select
            id="filtro-usuario-escola"
            value={escolaFiltro}
            onChange={(e) => setEscolaFiltro(e.target.value)}
          >
            <option value="TODAS">Todas</option>
            <option value="GLOBAL">Acesso global</option>
            {escolas.map((esc) => (
              <option key={esc.id} value={String(esc.id)}>
                {esc.nome}
              </option>
            ))}
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Perfil"
          htmlFor="filtro-usuario-perfil"
          className="md:col-span-3"
        >
          <Select
            id="filtro-usuario-perfil"
            value={perfilFiltro}
            onChange={(e) =>
              setPerfilFiltro(e.target.value as "TODOS" | TipoUsuario)
            }
          >
            <option value="TODOS">Todos</option>
            <option value="DIRETOR">Diretor</option>
            <option value="COORDENADOR">Coordenador</option>
            <option value="PROFESSOR">Professor</option>
            <option value="SUPERADMIN">Superadmin</option>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          label="Situação"
          htmlFor="filtro-usuario-situacao"
          className="md:col-span-2"
        >
          <Select
            id="filtro-usuario-situacao"
            value={situacaoFiltro}
            onChange={(e) =>
              setSituacaoFiltro(
                e.target.value as "TODAS" | "ATIVO" | "INATIVO"
              )
            }
          >
            <option value="TODAS">Todas</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </Select>
        </FieldWrapper>
      </div>

      <div>
        <LinkButton href="/admin/usuarios/novo" variant="primary">
          Cadastrar usuário
        </LinkButton>
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando usuários…
          </p>
        </Card>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={filtrados}
            rowKey={(row) => row.id}
            emptyMessage="Nenhum usuário encontrado."
          />
          <p className="text-[13px] text-[var(--atai-muted)]">
            {filtrados.length}{" "}
            {filtrados.length === 1
              ? "usuário encontrado"
              : "usuários encontrados"}
          </p>
        </>
      )}
    </AppShell>
  );
}
