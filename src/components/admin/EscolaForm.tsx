"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, LinkButton } from "@/components/ui/Button";
import { FieldWrapper, Input, Select } from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { DataProviderError, type Escola } from "@/types/domain";

interface EscolaFormProps {
  initialEscola?: Escola;
}

export function EscolaForm({ initialEscola }: EscolaFormProps) {
  const { provider, notifyMutation } = useApp();
  const router = useRouter();
  const isEditing = Boolean(initialEscola);

  const [nome, setNome] = useState(initialEscola?.nome ?? "");
  const [ativa, setAtiva] = useState(initialEscola?.ativa ?? true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError("Informe o nome completo da escola.");
      return;
    }

    setSaving(true);
    try {
      if (initialEscola) {
        await provider.atualizarEscola(initialEscola.id, {
          nome,
          ativa,
        });
      } else {
        await provider.criarEscola({
          nome,
          ativa,
        });
      }
      notifyMutation();
      router.push("/admin/escolas");
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível salvar os dados da escola."
      );
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
      {error ? <Banner variant="error">{error}</Banner> : null}

      <Card className="flex flex-col gap-5">
        <h2 className="text-[20px] font-semibold text-[var(--atai-navy)]">
          Dados da escola
        </h2>

        <FieldWrapper label="Nome da escola" htmlFor="escola-nome" required>
          <Input
            id="escola-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={120}
            placeholder="Digite o nome completo da instituição"
          />
        </FieldWrapper>

        <FieldWrapper
          label="Situação"
          htmlFor="escola-situacao"
          description="Escolas ativas podem operar no sistema."
          required
          className="max-w-[320px]"
        >
          <Select
            id="escola-situacao"
            value={ativa ? "ATIVA" : "INATIVA"}
            onChange={(e) => setAtiva(e.target.value === "ATIVA")}
          >
            <option value="ATIVA">Ativa</option>
            <option value="INATIVA">Inativa</option>
          </Select>
        </FieldWrapper>

        <Banner variant="info">
          {isEditing
            ? "Alterações de situação precisam preservar as atas e o histórico da escola."
            : "O identificador e a data de criação são gerados automaticamente."}
        </Banner>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Salvando…" : "Salvar escola"}
        </Button>
        <LinkButton href="/admin/escolas" variant="secondary">
          Cancelar
        </LinkButton>
      </div>
    </form>
  );
}
