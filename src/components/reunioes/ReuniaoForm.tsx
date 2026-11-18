"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Banner, Card } from "@/components/ui/Surface";
import { Button, LinkButton } from "@/components/ui/Button";
import {
  FieldWrapper,
  Input,
  Textarea,
} from "@/components/ui/FormFields";
import { useApp } from "@/context/app-context";
import {
  DataProviderError,
  type Reuniao,
  type TipoConteudoReuniao,
} from "@/types/domain";

interface ReuniaoFormProps {
  initialReuniao?: Reuniao;
  defaultAno?: number;
}

export function ReuniaoForm({
  initialReuniao,
  defaultAno = 2026,
}: ReuniaoFormProps) {
  const { provider, session, notifyMutation } = useApp();
  const router = useRouter();

  const [titulo, setTitulo] = useState(
    initialReuniao?.titulo ?? ""
  );
  const [dataReuniao, setDataReuniao] = useState(
    initialReuniao?.dataReuniao ?? "2026-11-18"
  );
  const [anoReferencia, setAnoReferencia] = useState(
    String(initialReuniao?.anoReferencia ?? defaultAno)
  );
  const [tipoConteudo, setTipoConteudo] = useState<TipoConteudoReuniao>(
    initialReuniao?.tipoConteudo ?? "TRANSCRICAO"
  );
  const [conteudo, setConteudo] = useState(
    initialReuniao
      ? initialReuniao.tipoConteudo === "ATA_PRONTA"
        ? initialReuniao.textoAtaEnviada ?? initialReuniao.transcricao ?? ""
        : initialReuniao.transcricao ?? ""
      : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validar = (): number | null => {
    if (!titulo.trim()) {
      setError("Informe o título da reunião.");
      return null;
    }
    if (!dataReuniao) {
      setError("Informe a data da reunião.");
      return null;
    }
    const anoNum = Number(anoReferencia);
    if (!Number.isInteger(anoNum) || anoNum < 2000 || anoNum > 2100) {
      setError("Ano de referência deve estar entre 2000 e 2100.");
      return null;
    }
    if (!conteudo.trim()) {
      setError(
        tipoConteudo === "TRANSCRICAO"
          ? "Cole a transcrição da reunião antes de continuar."
          : "Cole o texto da ata pronta antes de continuar."
      );
      return null;
    }
    return anoNum;
  };

  const salvarReuniao = async (): Promise<Reuniao | null> => {
    const anoNum = validar();
    if (anoNum == null) return null;

    if (!session?.usuario.escolaId) {
      setError("Usuário sem escola vinculada.");
      return null;
    }

    if (initialReuniao) {
      return provider.atualizarReuniao(initialReuniao.id, {
        titulo,
        dataReuniao,
        anoReferencia: anoNum,
        tipoConteudo,
        conteudo,
      });
    }

    return provider.criarReuniao({
      escolaId: session.usuario.escolaId,
      usuarioId: session.usuario.id,
      titulo,
      dataReuniao,
      anoReferencia: anoNum,
      tipoConteudo,
      conteudo,
    });
  };

  const handleSalvarRascunho = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const saved = await salvarReuniao();
      if (!saved) return;
      notifyMutation();
      router.push("/reunioes");
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível salvar o rascunho."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalisar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const saved = await salvarReuniao();
      if (!saved) return;
      notifyMutation();
      router.push(`/reunioes/${saved.id}/analise`);
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível iniciar a análise."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAnalisar} className="flex flex-col gap-6" noValidate>
      <p className="text-[14px] text-[var(--atai-muted)]">
        1. Registrar &nbsp;→&nbsp; 2. Analisar &nbsp;→&nbsp; 3. Revisar e confirmar
      </p>

      {error ? <Banner variant="error">{error}</Banner> : null}

      <Card className="flex flex-col gap-5">
        <FieldWrapper label="Título da reunião" htmlFor="reuniao-titulo" required>
          <Input
            id="reuniao-titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Conselho escolar — prioridades de novembro"
            maxLength={150}
          />
        </FieldWrapper>

        <div className="grid gap-4 md:grid-cols-2">
          <FieldWrapper
            label="Data da reunião"
            htmlFor="reuniao-data"
            required
          >
            <Input
              id="reuniao-data"
              type="date"
              value={dataReuniao}
              onChange={(e) => setDataReuniao(e.target.value)}
            />
          </FieldWrapper>

          <FieldWrapper
            label="Ano de referência"
            htmlFor="reuniao-ano"
            description="Ano da lista de prioridades que será alterada."
            required
          >
            <Input
              id="reuniao-ano"
              type="number"
              min={2000}
              max={2100}
              value={anoReferencia}
              onChange={(e) => setAnoReferencia(e.target.value)}
            />
          </FieldWrapper>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[16px] font-semibold text-[var(--atai-navy)]">
            Qual conteúdo você vai enviar?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setTipoConteudo("TRANSCRICAO")}
              className={`min-h-[44px] rounded-[8px] px-4 py-2.5 text-[14px] font-medium transition-colors cursor-pointer ${
                tipoConteudo === "TRANSCRICAO"
                  ? "bg-[var(--atai-green)] text-white"
                  : "border border-[var(--atai-line)] bg-[var(--atai-white)] text-[var(--atai-navy)] hover:bg-[#faf7f0]"
              }`}
            >
              {tipoConteudo === "TRANSCRICAO" ? "● " : "○ "}Transcrição
            </button>
            <button
              type="button"
              onClick={() => setTipoConteudo("ATA_PRONTA")}
              className={`min-h-[44px] rounded-[8px] px-4 py-2.5 text-[14px] font-medium transition-colors cursor-pointer ${
                tipoConteudo === "ATA_PRONTA"
                  ? "bg-[var(--atai-green)] text-white"
                  : "border border-[var(--atai-line)] bg-[var(--atai-white)] text-[var(--atai-navy)] hover:bg-[#faf7f0]"
              }`}
            >
              {tipoConteudo === "ATA_PRONTA" ? "● " : "○ "}Ata pronta
            </button>
          </div>
        </div>

        <Banner variant="info">
          {tipoConteudo === "TRANSCRICAO"
            ? "A IA prepara uma minuta e sugere alterações. Você revisa tudo antes de confirmar."
            : "A IA extrai as decisões da ata pronta. O texto enviado será preservado."}
        </Banner>

        <div className="flex flex-col gap-2 rounded-[8px] border border-[var(--atai-line)] p-4">
          <label
            htmlFor="reuniao-conteudo"
            className="text-[14px] font-semibold text-[var(--atai-navy)]"
          >
            {tipoConteudo === "TRANSCRICAO"
              ? "Transcrição *"
              : "Texto da ata pronta *"}
          </label>
          <Textarea
            id="reuniao-conteudo"
            rows={6}
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder={
              tipoConteudo === "TRANSCRICAO"
                ? "Diretora: detalhar o reparo da cobertura, mantendo a ordem 1.\nCoordenador: manter a biblioteca em segundo e retirar a conexão dos laboratórios.\nDiretora: incluir a adequação da rampa de acesso na ordem 3."
                : "Ata do conselho escolar de 13/11/2026.\nDeliberou-se incluir a adequação da rampa de acesso na ordem 3, atualizar o reparo da cobertura e retirar a conexão dos laboratórios da lista vigente."
            }
          />
          <p className="text-[12.5px] text-[var(--atai-muted)]">
            {tipoConteudo === "TRANSCRICAO"
              ? "Cole o texto completo da reunião. Dica para teste: inclua [ERRO] para simular falha de análise."
              : "Cole a ata completa. Nenhuma nova minuta será gerada."}
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" disabled={submitting}>
          {tipoConteudo === "TRANSCRICAO"
            ? "Analisar transcrição"
            : "Analisar ata pronta"}
        </Button>
        <Button
          variant="secondary"
          onClick={handleSalvarRascunho}
          disabled={submitting}
        >
          Salvar rascunho
        </Button>
        {initialReuniao ? (
          <LinkButton
            href={`/reunioes/${initialReuniao.id}/excluir`}
            variant="ghost"
          >
            Excluir rascunho
          </LinkButton>
        ) : (
          <LinkButton href="/reunioes" variant="ghost">
            Cancelar
          </LinkButton>
        )}
      </div>
    </form>
  );
}
