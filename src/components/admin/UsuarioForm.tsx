"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import {
  DataProviderError,
  type Escola,
  type TipoUsuario,
  type Usuario,
} from "@/types/domain";

interface UsuarioFormProps {
  initialUsuario?: Usuario;
}

const ROLE_DESCRIPTIONS: Record<TipoUsuario, string> = {
  DIRETOR:
    "Diretores registram reuniões, revisam propostas e são os únicos autorizados a confirmar atas e alterar prioridades.",
  COORDENADOR:
    "Coordenadores registram reuniões e revisam propostas. Somente o diretor confirma as decisões.",
  PROFESSOR:
    "Professores consultam as prioridades confirmadas da escola sem editar reuniões ou atas.",
  SUPERADMIN:
    "Superadmin possui acesso administrativo global para gerenciar escolas e usuários, sem vínculo a uma única escola.",
};

export function UsuarioForm({ initialUsuario }: UsuarioFormProps) {
  const { provider, notifyMutation } = useApp();
  const router = useRouter();
  const isEditing = Boolean(initialUsuario);

  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [nome, setNome] = useState(initialUsuario?.nome ?? "");
  const [email, setEmail] = useState(initialUsuario?.email ?? "");
  const [tipo, setTipo] = useState<TipoUsuario>(
    initialUsuario?.tipo ?? "COORDENADOR"
  );
  const [escolaId, setEscolaId] = useState<string>(
    initialUsuario?.escolaId != null ? String(initialUsuario.escolaId) : ""
  );
  const [senhaInicial, setSenhaInicial] = useState("");
  const [ativo, setAtivo] = useState(initialUsuario?.ativo ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    provider.listarEscolas(true).then((lista) => {
      if (!active) return;
      setEscolas(lista);
      if (!initialUsuario && !escolaId) {
        const primeiraAtiva = lista.find((e) => e.ativa) ?? lista[0];
        if (primeiraAtiva) setEscolaId(String(primeiraAtiva.id));
      }
    });
    return () => {
      active = false;
    };
  }, [provider, initialUsuario, escolaId]);

  const isSuperadmin = tipo === "SUPERADMIN";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("Informe o nome completo do usuário.");
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Informe um e-mail válido.");
      return;
    }
    if (!isSuperadmin && !escolaId) {
      setError("Selecione uma escola para este perfil.");
      return;
    }
    if (!isEditing && !senhaInicial.trim()) {
      setError("Informe a senha inicial para o novo usuário.");
      return;
    }

    setSaving(true);
    try {
      if (initialUsuario) {
        await provider.atualizarUsuario(initialUsuario.id, {
          nome,
          email,
          tipo,
          escolaId: isSuperadmin ? null : Number(escolaId),
          ativo,
        });
      } else {
        await provider.criarUsuario({
          nome,
          email,
          tipo,
          escolaId: isSuperadmin ? null : Number(escolaId),
          senhaHash: senhaInicial,
          ativo,
        });
      }
      notifyMutation();
      router.push("/admin/usuarios");
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível salvar os dados do usuário."
      );
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {error ? <Banner variant="error">{error}</Banner> : null}

      <Card className="flex flex-col gap-5">
        <h2 className="text-[20px] font-semibold text-[var(--atai-navy)]">
          Dados do usuário
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldWrapper label="Nome completo" htmlFor="usr-nome" required>
            <Input
              id="usr-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={100}
              placeholder="Nome e sobrenome"
            />
          </FieldWrapper>

          <FieldWrapper label="E-mail" htmlFor="usr-email" required>
            <Input
              id="usr-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={120}
              placeholder="nome@escola.edu.br"
            />
          </FieldWrapper>

          <FieldWrapper label="Perfil" htmlFor="usr-perfil" required>
            <Select
              id="usr-perfil"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoUsuario)}
            >
              <option value="DIRETOR">Diretor</option>
              <option value="COORDENADOR">Coordenador</option>
              <option value="PROFESSOR">Professor</option>
              <option value="SUPERADMIN">Superadmin</option>
            </Select>
          </FieldWrapper>

          <FieldWrapper
            label="Escola"
            htmlFor="usr-escola"
            required={!isSuperadmin}
          >
            {isSuperadmin ? (
              <Input
                id="usr-escola"
                value="Acesso global"
                disabled
                readOnly
              />
            ) : (
              <Select
                id="usr-escola"
                value={escolaId}
                onChange={(e) => setEscolaId(e.target.value)}
              >
                <option value="">Selecione uma escola</option>
                {escolas.map((esc) => (
                  <option key={esc.id} value={esc.id}>
                    {esc.nome}
                    {esc.ativa ? "" : " (Inativa)"}
                  </option>
                ))}
              </Select>
            )}
          </FieldWrapper>
        </div>

        <Banner variant="info">{ROLE_DESCRIPTIONS[tipo]}</Banner>

        {!isEditing ? (
          <FieldWrapper
            label="Senha inicial"
            htmlFor="usr-senha"
            description="Regra de senha a definir na implementação."
            required
            className="max-w-[440px]"
          >
            <Input
              id="usr-senha"
              type="password"
              value={senhaInicial}
              onChange={(e) => setSenhaInicial(e.target.value)}
              placeholder="••••••••••••"
            />
          </FieldWrapper>
        ) : null}

        <FieldWrapper
          label="Situação"
          htmlFor="usr-situacao"
          required
          className="max-w-[440px]"
        >
          <Select
            id="usr-situacao"
            value={ativo ? "ATIVO" : "INATIVO"}
            onChange={(e) => setAtivo(e.target.value === "ATIVO")}
          >
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
          </Select>
        </FieldWrapper>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Salvando…" : "Salvar usuário"}
        </Button>
        <LinkButton href="/admin/usuarios" variant="secondary">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}
