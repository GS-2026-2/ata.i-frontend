"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { Button, LinkButton } from "@/components/ui/Button";
import {
  FieldWrapper,
  Input,
  Select,
  Textarea,
} from "@/components/ui/FormFields";
import { Banner, Card } from "@/components/ui/Surface";
import { useApp } from "@/context/app-context";
import { formatOrderTwoDigits } from "@/lib/formatters";
import {
  DataProviderError,
  type Ata,
  type OperacaoPrioridade,
  type PrioridadeAnual,
  type Reuniao,
} from "@/types/domain";

export default function EditarPropostaPage() {
  const params = useParams<{ id: string; propostaId: string }>();
  const reuniaoId = Number(params.id);
  const isNova = params.propostaId === "nova";
  const propostaId = isNova ? null : Number(params.propostaId);

  const { provider, notifyMutation } = useApp();
  const router = useRouter();

  const [reuniao, setReuniao] = useState<Reuniao | null>(null);
  const [ata, setAta] = useState<Ata | null>(null);
  const [prioridades, setPrioridades] = useState<PrioridadeAnual[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [operacao, setOperacao] = useState<OperacaoPrioridade>("INCLUIR");
  const [prioridadeId, setPrioridadeId] = useState<string>("");
  const [descricaoProposta, setDescricaoProposta] = useState("");
  const [ordemProposta, setOrdemProposta] = useState("1");
  const [justificativa, setJustificativa] = useState("");
  const [trechoOrigem, setTrechoOrigem] = useState("");

  useEffect(() => {
    let active = true;
    async function carregar() {
      setLoading(true);
      try {
        const r = await provider.buscarReuniaoPorId(reuniaoId);
        const a = await provider.buscarAtaPorReuniao(reuniaoId);
        const p = await provider.listarPrioridades(r.escolaId, r.anoReferencia);
        if (!active) return;

        setReuniao(r);
        setAta(a);
        setPrioridades(p);

        if (!a) {
          setError("Ata não encontrada para esta reunião.");
          return;
        }

        if (isNova) {
          const nextOrdem =
            p.reduce((max, item) => Math.max(max, item.ordem), 0) + 1;
          setOperacao("INCLUIR");
          setOrdemProposta(String(nextOrdem));
          setPrioridadeId(p[0] ? String(p[0].id) : "");
          setTrechoOrigem("");
        } else {
          const prop = a.alteracoes.find((item) => item.id === propostaId);
          if (!prop) {
            setError("Proposta de alteração não encontrada.");
            return;
          }
          setOperacao(prop.operacao);
          setPrioridadeId(
            prop.prioridadeId != null
              ? String(prop.prioridadeId)
              : p[0]
              ? String(p[0].id)
              : ""
          );
          setDescricaoProposta(prop.descricaoProposta ?? "");
          setOrdemProposta(
            prop.ordemProposta != null ? String(prop.ordemProposta) : ""
          );
          setJustificativa(prop.justificativa ?? "");
          setTrechoOrigem(prop.trechoOrigem ?? "");
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error ? err.message : "Erro ao carregar proposta."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    carregar();
    return () => {
      active = false;
    };
  }, [provider, reuniaoId, isNova, propostaId]);

  const currentIndex = useMemo(() => {
    if (!ata || isNova || propostaId == null) return -1;
    return ata.alteracoes.findIndex((a) => a.id === propostaId);
  }, [ata, isNova, propostaId]);

  const prevProposta =
    ata && currentIndex > 0 ? ata.alteracoes[currentIndex - 1] : null;
  const nextProposta =
    ata && currentIndex >= 0 && currentIndex < ata.alteracoes.length - 1
      ? ata.alteracoes[currentIndex + 1]
      : null;

  const handleOperacaoChange = (nextOp: OperacaoPrioridade) => {
    setOperacao(nextOp);
    if (nextOp !== "INCLUIR" && !prioridadeId && prioridades[0]) {
      const first = prioridades[0];
      setPrioridadeId(String(first.id));
      if (!descricaoProposta) setDescricaoProposta(first.descricao);
      if (!ordemProposta) setOrdemProposta(String(first.ordem));
    }
  };

  const handlePrioridadeTargetChange = (nextId: string) => {
    setPrioridadeId(nextId);
    const target = prioridades.find((p) => p.id === Number(nextId));
    if (target) {
      setDescricaoProposta(target.descricao);
      if (operacao === "ATUALIZAR") {
        setOrdemProposta(String(target.ordem));
      }
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ata) return;
    setError(null);

    if (operacao !== "INCLUIR" && !prioridadeId) {
      setError("Selecione a prioridade vigente que será alterada ou removida.");
      return;
    }

    if (operacao === "INCLUIR" && !descricaoProposta.trim()) {
      setError("Informe a descrição proposta para a nova prioridade.");
      return;
    }

    const ordemNum =
      operacao === "REMOVER"
        ? null
        : ordemProposta.trim()
        ? Number(ordemProposta)
        : null;

    if (
      operacao !== "REMOVER" &&
      (ordemNum == null || !Number.isInteger(ordemNum) || ordemNum < 1 || ordemNum > 999)
    ) {
      setError("Informe uma ordem proposta válida (entre 1 e 999).");
      return;
    }

    const payload = {
      operacao,
      prioridadeId: operacao === "INCLUIR" ? null : Number(prioridadeId),
      descricaoProposta:
        operacao === "REMOVER"
          ? prioridades.find((p) => p.id === Number(prioridadeId))?.descricao ??
            (descricaoProposta.trim() || null)
          : descricaoProposta.trim(),
      ordemProposta: ordemNum,
      justificativa: justificativa.trim() || null,
      trechoOrigem: trechoOrigem.trim() || null,
    };

    setSaving(true);
    try {
      if (isNova) {
        await provider.adicionarAlteracao(ata.id, payload);
      } else if (propostaId != null) {
        await provider.atualizarAlteracao(ata.id, propostaId, payload);
      }
      notifyMutation();
      router.push(`/reunioes/${reuniaoId}/revisao`);
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível salvar a proposta."
      );
      setSaving(false);
    }
  };

  const handleRemoverProposta = async () => {
    if (!ata || propostaId == null) return;
    setSaving(true);
    try {
      await provider.removerAlteracao(ata.id, propostaId);
      notifyMutation();
      router.push(`/reunioes/${reuniaoId}/revisao`);
    } catch (err) {
      setError(
        err instanceof DataProviderError
          ? err.message
          : "Não foi possível remover a proposta."
      );
      setSaving(false);
    }
  };

  return (
    <AppShell breadcrumb="Minha escola / Revisar proposta">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageHeader
          title={isNova ? "Nova proposta de alteração" : "Revisar proposta"}
          subtitle="Compare a sugestão com o trecho de origem antes de salvar."
        />
        {!isNova && ata && ata.alteracoes.length > 1 ? (
          <div className="flex items-center gap-3 text-[13px]">
            <span className="text-[var(--atai-muted)]">
              Proposta {currentIndex + 1} de {ata.alteracoes.length}
            </span>
            {prevProposta ? (
              <Link
                href={`/reunioes/${reuniaoId}/revisao/propostas/${prevProposta.id}`}
                className="font-semibold text-[var(--atai-blue)] hover:underline"
              >
                ← Anterior
              </Link>
            ) : null}
            {nextProposta ? (
              <Link
                href={`/reunioes/${reuniaoId}/revisao/propostas/${nextProposta.id}`}
                className="font-semibold text-[var(--atai-blue)] hover:underline"
              >
                Próxima →
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>

      {loading ? (
        <Card>
          <p className="text-[14px] text-[var(--atai-muted)]">
            Carregando proposta…
          </p>
        </Card>
      ) : !reuniao || !ata ? (
        <div className="flex flex-col gap-4">
          <Banner variant="error">{error ?? "Proposta não encontrada."}</Banner>
          <div>
            <LinkButton
              href={`/reunioes/${reuniaoId}/revisao`}
              variant="secondary"
            >
              Voltar à revisão
            </LinkButton>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSalvar} className="flex flex-col gap-6" noValidate>
          {error ? <Banner variant="error">{error}</Banner> : null}

          <div className="grid gap-4 lg:grid-cols-12">
            {/* Formulário */}
            <Card className="flex flex-col gap-5 lg:col-span-7">
              <FieldWrapper label="Operação" htmlFor="prop-operacao">
                <Select
                  id="prop-operacao"
                  value={operacao}
                  onChange={(e) =>
                    handleOperacaoChange(e.target.value as OperacaoPrioridade)
                  }
                >
                  <option value="INCLUIR">Incluir</option>
                  <option value="ATUALIZAR">Atualizar</option>
                  <option value="REMOVER">Remover</option>
                </Select>
              </FieldWrapper>

              {operacao !== "INCLUIR" ? (
                <FieldWrapper
                  label="Prioridade vigente alvo"
                  htmlFor="prop-alvo"
                  required
                >
                  {prioridades.length === 0 ? (
                    <Banner variant="error">
                      Não há prioridades vigentes ativas neste ano para atualizar ou remover.
                    </Banner>
                  ) : (
                    <Select
                      id="prop-alvo"
                      value={prioridadeId}
                      onChange={(e) =>
                        handlePrioridadeTargetChange(e.target.value)
                      }
                    >
                      {prioridades.map((p) => (
                        <option key={p.id} value={p.id}>
                          {formatOrderTwoDigits(p.ordem)} · {p.descricao}
                        </option>
                      ))}
                    </Select>
                  )}
                </FieldWrapper>
              ) : null}

              {operacao !== "REMOVER" ? (
                <>
                  <FieldWrapper
                    label="Descrição proposta"
                    htmlFor="prop-descricao"
                    required
                  >
                    <Input
                      id="prop-descricao"
                      value={descricaoProposta}
                      onChange={(e) => setDescricaoProposta(e.target.value)}
                      maxLength={500}
                      placeholder="Ex.: Adequar a rampa de acesso"
                    />
                  </FieldWrapper>

                  <FieldWrapper
                    label="Ordem proposta"
                    htmlFor="prop-ordem"
                    required
                  >
                    <Input
                      id="prop-ordem"
                      type="number"
                      min={1}
                      max={999}
                      value={ordemProposta}
                      onChange={(e) => setOrdemProposta(e.target.value)}
                    />
                  </FieldWrapper>
                </>
              ) : null}

              <FieldWrapper label="Justificativa" htmlFor="prop-justificativa">
                <Textarea
                  id="prop-justificativa"
                  rows={3}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  maxLength={1000}
                  placeholder="Explique o motivo da alteração proposta."
                />
              </FieldWrapper>
            </Card>

            {/* Trecho de origem */}
            <Card className="flex flex-col gap-4 self-start lg:col-span-5">
              <h2 className="text-[20px] font-semibold text-[var(--atai-navy)]">
                Trecho de origem
              </h2>

              <p className="text-[16px] leading-[1.5] text-[var(--atai-navy)]">
                {trechoOrigem
                  ? `“${trechoOrigem.replace(/^[“"]|[”"]$/g, "")}”`
                  : "Nenhum trecho destacado informado."}
              </p>

              <FieldWrapper
                label="Editar trecho citado (opcional)"
                htmlFor="prop-trecho"
              >
                <Textarea
                  id="prop-trecho"
                  rows={3}
                  value={trechoOrigem}
                  onChange={(e) => setTrechoOrigem(e.target.value)}
                  maxLength={2000}
                  placeholder="Trecho da transcrição ou ata que originou esta proposta"
                />
              </FieldWrapper>

              <div className="flex flex-col gap-1 text-[13.5px] leading-[1.45] text-[var(--atai-muted)]">
                <p>Referência: {reuniao.titulo}</p>
                <p>Escola: {reuniao.escolaNome}</p>
                <p>Ano: {reuniao.anoReferencia}</p>
              </div>

              <Banner variant="info">
                A proposta só passa a valer após a confirmação do diretor.
              </Banner>
            </Card>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? "Salvando…" : "Salvar proposta"}
            </Button>
            <LinkButton
              href={`/reunioes/${reuniaoId}/revisao`}
              variant="secondary"
            >
              Cancelar
            </LinkButton>
            {!isNova ? (
              <Button
                variant="ghost"
                onClick={handleRemoverProposta}
                disabled={saving}
                className="text-[var(--atai-red)] hover:bg-[var(--atai-error)]/60"
              >
                Remover proposta
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </AppShell>
  );
}
