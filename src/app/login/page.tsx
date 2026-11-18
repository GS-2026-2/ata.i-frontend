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

function DocumentOutlineDecor({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 148"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16 4H78L112 38V132C112 138.627 106.627 144 100 144H16C9.37258 144 4 138.627 4 132V16C4 9.37258 9.37258 4 16 4Z"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        d="M78 4V30C78 34.4183 81.5817 38 86 38H112"
        stroke="currentColor"
        strokeWidth="3"
      />
      <line
        x1="24"
        y1="60"
        x2="92"
        y2="60"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="78"
        x2="82"
        y2="78"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="24"
        y1="96"
        x2="64"
        y2="96"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle
        cx="80"
        cy="114"
        r="14"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path
        d="M74 114L78.5 118.5L87 109.5"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoginBackgroundShapes() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden text-[var(--atai-green)]"
    >
      {/* Formas geométricas suaves */}
      <div className="absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full bg-current opacity-[0.045]" />
      <div className="absolute -bottom-28 -left-24 h-[340px] w-[340px] rounded-full border-[28px] border-current opacity-[0.05]" />
      <div className="absolute right-[12%] top-[44%] h-28 w-28 rotate-12 rounded-[20px] border-2 border-current opacity-[0.08]" />
      <div className="absolute left-[8%] top-[18%] h-14 w-14 -rotate-12 rounded-[12px] bg-current opacity-[0.05]" />
      <div className="absolute bottom-[18%] right-[22%] h-10 w-10 rounded-full bg-current opacity-[0.07]" />

      {/* Silhuetas de documentos em diferentes tamanhos */}
      <DocumentOutlineDecor className="absolute -right-6 top-[10%] w-[160px] rotate-12 opacity-[0.07] xl:right-[6%] xl:w-[190px]" />
      <DocumentOutlineDecor className="absolute bottom-[7%] right-[7%] w-[112px] -rotate-6 opacity-[0.08] xl:w-[132px]" />
      <DocumentOutlineDecor className="hidden sm:block absolute bottom-[26%] left-[4%] w-[78px] -rotate-12 opacity-[0.06]" />
      <DocumentOutlineDecor className="hidden xl:block absolute left-[48%] top-[6%] w-[64px] rotate-6 opacity-[0.055]" />
    </div>
  );
}

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
      {/* Coluna Institucional (ampliada em telas maiores com destaque para a marca) */}
      <section className="relative flex w-full flex-col justify-between gap-10 overflow-hidden bg-[var(--atai-bg)] p-8 sm:p-12 lg:flex-1 lg:px-16 lg:py-14 xl:px-24 xl:py-16">
        <LoginBackgroundShapes />

        <div className="relative z-10 mx-auto flex w-full max-w-[680px] flex-1 flex-col justify-center gap-8 lg:gap-10">
          <div className="h-[88px] w-[264px] sm:h-[96px] sm:w-[290px] lg:h-[108px] lg:w-[324px]">
            <Image
              src="/images/logo-atai.png"
              alt="ATA.I"
              width={324}
              height={108}
              priority
              className="h-full w-full object-contain object-left"
            />
          </div>

          <h1 className="text-[36px] font-semibold leading-[1.26] text-[var(--atai-navy)] sm:text-[42px] xl:text-[50px]">
            Decisões claras.
            <br />
            Gestão com memória.
          </h1>

          <p className="max-w-[540px] text-[18px] leading-[1.45] text-[var(--atai-muted)] xl:text-[21px]">
            Organize as prioridades da escola e preserve o caminho de cada decisão.
          </p>

          <div className="flex max-w-[560px] flex-col gap-4 rounded-[10px] border border-[var(--atai-line)] bg-[var(--atai-white)]/95 p-6 shadow-[0_6px_24px_rgba(22,58,86,0.04)] backdrop-blur-[2px] sm:p-7">
            <div>
              <span className="inline-flex items-center rounded-[6px] bg-[var(--atai-pale)] px-2.5 py-1.5 text-[12px] font-semibold leading-none text-[var(--atai-green)]">
                Decisão registrada
              </span>
            </div>
            <p className="text-[22px] font-semibold leading-[1.35] text-[var(--atai-navy)] lg:text-[25px]">
              Uma reunião.
              <br />
              Prioridades que avançam.
            </p>
            <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)] lg:text-[16px]">
              Ata confirmada → Lista anual atualizada → Histórico preservado
            </p>
          </div>
        </div>

        <p className="relative z-10 mx-auto w-full max-w-[680px] text-[13px] leading-[1.45] text-[var(--atai-muted)]">
          ATA.I · Gestão de prioridades escolares
        </p>
      </section>

      {/* Coluna de Autenticação (largura controlada e centralizada) */}
      <section className="flex w-full shrink-0 items-center justify-center border-t border-[var(--atai-line)]/60 bg-[var(--atai-white)] p-8 sm:p-12 lg:w-[44%] lg:min-w-[460px] lg:max-w-[580px] lg:border-l lg:border-t-0 lg:px-14 lg:py-12">
        <div className="flex w-full max-w-[390px] flex-col gap-6">
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[28px] font-semibold leading-[1.3] text-[var(--atai-navy)] sm:text-[32px]">
              Bem-vindo ao ATA.I
            </h2>
            <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)] sm:text-[16px]">
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

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
                className="min-w-[128px]"
              >
                {submitting ? "Entrando…" : "Entrar"}
              </Button>

              <Button
                variant="secondary"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? "Ocultar senha" : "Mostrar senha"}
              </Button>
            </div>
          </form>

          <div className="flex flex-col gap-3 pt-1">
            <p className="text-[14px] leading-[1.45] text-[var(--atai-muted)]">
              Precisa de acesso? Procure o administrador da sua escola.
            </p>
            <p className="text-[12px] leading-[1.45] text-[var(--atai-muted)]">
              Ambiente de demonstração · Dados fictícios (senha padrão:{" "}
              <code className="font-semibold">123456</code>)
            </p>

            {/* Atalhos discretos de preenchimento para apresentação */}
            <div className="mt-1 flex flex-col gap-2.5 rounded-[8px] border border-[var(--atai-line)] bg-[var(--atai-bg)]/70 p-4">
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
