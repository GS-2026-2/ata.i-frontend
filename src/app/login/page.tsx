"use client";

import React, { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Banner } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { FieldWrapper, Input } from "@/components/ui/FormFields";
import { useApp } from "@/context/app-context";
import { getHomeRouteForRole } from "@/lib/permissions";
import { DataProviderError } from "@/types/domain";

const DEMO_ACCOUNTS = [
  { label: "Diretor (Ana)", email: "ana.souza@escola.edu.br" },
  { label: "Coordenador (Bruno)", email: "bruno.lima@escola.edu.br" },
  { label: "Professor (Carla)", email: "carla.santos@escola.edu.br" },
  { label: "Superadmin (Marina)", email: "marina.costa@escola.edu.br" },
];

function LoginForm({ isInvalidDemo }: { isInvalidDemo: boolean }) {
  const { session, loadingSession, login } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState("ana.souza@escola.edu.br");
  const [password, setPassword] = useState(
    isInvalidDemo ? "senha-errada" : "123456"
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    isInvalidDemo
      ? "E-mail ou senha incorretos. Confira os dados e tente novamente."
      : null
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loadingSession && session && !isInvalidDemo) {
      router.replace(getHomeRouteForRole(session.usuario.tipo));
    }
  }, [loadingSession, session, isInvalidDemo, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Informe e-mail e senha para entrar.");
      return;
    }

    setSubmitting(true);
    try {
      const nextSession = await login(email, password);
      router.push(getHomeRouteForRole(nextSession.usuario.tipo));
    } catch (err) {
      if (err instanceof DataProviderError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Não foi possível validar o acesso. Tente novamente.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("123456");
    setErrorMessage(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--atai-white)] lg:flex-row">
      {/* Coluna Institucional */}
      <section className="flex w-full shrink-0 flex-col justify-between gap-8 bg-[var(--atai-bg)] p-8 sm:p-12 lg:w-[660px] lg:p-[72px]">
        <div className="flex flex-col gap-8">
          <div className="h-[80px] w-[240px]">
            <Image
              src="/images/logo-atai.png"
              alt="ATA.I"
              width={240}
              height={80}
              priority
              className="h-[80px] w-[240px] object-contain object-left"
            />
          </div>

          <h1 className="text-[36px] font-semibold leading-[1.3] text-[var(--atai-navy)] lg:text-[44px]">
            Decisões claras.
            <br />
            Gestão com memória.
          </h1>

          <p className="max-w-[500px] text-[18px] leading-[1.45] text-[var(--atai-muted)] lg:text-[20px]">
            Organize as prioridades da escola e preserve o caminho de cada decisão.
          </p>

          <div className="flex max-w-[516px] flex-col gap-4 rounded-[8px] border border-[var(--atai-line)] bg-[var(--atai-white)] p-6">
            <div>
              <span className="inline-flex items-center rounded-[6px] bg-[var(--atai-pale)] px-2.5 py-1.5 text-[12px] font-semibold leading-none text-[var(--atai-green)]">
                Decisão registrada
              </span>
            </div>
            <p className="text-[22px] font-semibold leading-[1.4] text-[var(--atai-navy)] lg:text-[24px]">
              Uma reunião.
              <br />
              Prioridades que avançam.
            </p>
            <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)] lg:text-[16px]">
              Ata confirmada → Lista anual atualizada → Histórico preservado
            </p>
          </div>
        </div>

        <p className="text-[13px] leading-[1.45] text-[var(--atai-muted)]">
          ATA.I · Gestão de prioridades escolares
        </p>
      </section>

      {/* Coluna de Autenticação */}
      <section className="flex flex-1 items-start justify-center bg-[var(--atai-white)] p-8 sm:p-12 lg:justify-start lg:p-[112px]">
        <div className="flex w-full max-w-[500px] flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h2 className="text-[32px] font-semibold leading-[1.35] text-[var(--atai-navy)]">
              Bem-vindo ao ATA.I
            </h2>
            <p className="text-[16px] leading-[1.45] text-[var(--atai-muted)]">
              Entre com o acesso fornecido pela administração.
            </p>
          </div>

          {errorMessage ? <Banner variant="error">{errorMessage}</Banner> : null}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <FieldWrapper label="E-mail" htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ana.souza@escola.edu.br"
                hasError={Boolean(errorMessage)}
              />
            </FieldWrapper>

            <FieldWrapper label="Senha" htmlFor="login-password">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </FieldWrapper>

            <div className="flex flex-col items-start gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </Button>

              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? "Entrando…" : "Entrar"}
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-3 pt-2">
            <p className="text-[14px] leading-[1.45] text-[var(--atai-muted)]">
              Precisa de acesso? Procure o administrador da sua escola.
            </p>
            <p className="text-[12px] leading-[1.45] text-[var(--atai-muted)]">
              Ambiente de demonstração · Dados fictícios (senha padrão:{" "}
              <code className="font-semibold">123456</code>)
            </p>

            {/* Atalhos discretos de preenchimento para apresentação */}
            <div className="mt-2 flex flex-col gap-2.5 rounded-[8px] border border-[var(--atai-line)] bg-[var(--atai-bg)]/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-[var(--atai-navy)]">
                  Acesso rápido para demonstração
                </p>
                <Link
                  href="/demo"
                  className="text-[12px] font-semibold text-[var(--atai-blue)] hover:underline"
                >
                  Ver roteiros →
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemoAccount(acc.email)}
                    className={`rounded-[6px] border px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer ${
                      email.trim().toLowerCase() === acc.email
                        ? "border-[var(--atai-green)] bg-[var(--atai-pale)] text-[var(--atai-green)]"
                        : "border-[var(--atai-line)] bg-[var(--atai-white)] text-[var(--atai-navy)] hover:bg-[#faf7f0]"
                    }`}
                  >
                    {acc.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const isInvalidDemo = searchParams.get("demo") === "invalid";
  return (
    <LoginForm
      key={isInvalidDemo ? "invalid" : "default"}
      isInvalidDemo={isInvalidDemo}
    />
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
          Carregando…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
