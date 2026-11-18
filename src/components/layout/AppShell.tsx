"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApp } from "@/context/app-context";
import { formatTipoUsuario } from "@/lib/formatters";
import {
  canAccessRoute,
  getHomeRouteForRole,
  getNavItemsForRole,
  getSidebarHeaderLabel,
} from "@/lib/permissions";

interface AppShellProps {
  breadcrumb: string;
  children: React.ReactNode;
}

function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/historico" && pathname.startsWith("/atas/")) {
    return true;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ breadcrumb, children }: AppShellProps) {
  const { session, loadingSession, logout } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (loadingSession) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!canAccessRoute(session.usuario.tipo, pathname)) {
      router.replace(getHomeRouteForRole(session.usuario.tipo));
    }
  }, [loadingSession, session, pathname, router]);

  if (loadingSession || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
        Carregando ambiente ATA.I…
      </div>
    );
  }

  if (!canAccessRoute(session.usuario.tipo, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
        Redirecionando para a área autorizada…
      </div>
    );
  }

  const { usuario, escola } = session;
  const navItems = getNavItemsForRole(usuario.tipo);
  const homeHref = getHomeRouteForRole(usuario.tipo);
  const sectionLabel = getSidebarHeaderLabel(usuario.tipo);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const sidebarContent = (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <Link href={homeHref} className="block w-[180px] h-[60px] relative">
          <Image
            src="/images/logo-atai.png"
            alt="ATA.I"
            width={180}
            height={60}
            priority
            className="h-[60px] w-[180px] object-contain object-left"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="rounded-[6px] p-1.5 text-[var(--atai-muted)] hover:bg-[var(--atai-bg)] lg:hidden"
          aria-label="Fechar menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <p className="text-[11px] font-semibold tracking-[0.04em] text-[var(--atai-muted)]">
        {sectionLabel}
      </p>

      <div className="flex flex-col gap-2 rounded-[8px] border border-[var(--atai-line)] bg-[var(--atai-bg)] px-3 py-5">
        <p className="text-[14px] font-semibold leading-[1.4] text-[var(--atai-navy)]">
          {usuario.tipo === "SUPERADMIN"
            ? "Todas as escolas"
            : escola?.nome ?? usuario.escolaNome ?? "Escola vinculada"}
        </p>
        <p className="text-[12px] leading-[1.4] text-[var(--atai-muted)]">
          {usuario.tipo === "SUPERADMIN"
            ? "Superadmin"
            : escola?.localizacao ?? "Gestão escolar"}
        </p>
      </div>

      <nav className="flex flex-col gap-1.5" aria-label="Menu principal">
        {navItems.map((item) => {
          const active = isNavItemActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-between gap-2 rounded-[8px] p-3 text-[14px] leading-[1.45] transition-colors ${
                active
                  ? "bg-[var(--atai-pale)] font-semibold text-[var(--atai-green)]"
                  : "font-normal text-[var(--atai-muted)] hover:bg-[var(--atai-bg)]/70 hover:text-[var(--atai-navy)]"
              }`}
            >
              <span>{item.label}</span>
              {item.tag ? (
                <span className="rounded-[5px] bg-[var(--atai-info)] px-1.5 py-0.5 text-[11px] font-semibold leading-none text-[var(--atai-blue)]">
                  {item.tag}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-[14px] font-semibold leading-[1.45] text-[var(--atai-navy)]">
            {usuario.nome}
          </p>
          <p className="text-[12px] leading-[1.45] text-[var(--atai-muted)]">
            {formatTipoUsuario(usuario.tipo)}
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={handleLogout}
            className="min-h-[40px] px-4 py-2 text-[14px]"
          >
            Sair
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[var(--atai-bg)]">
      {/* Sidebar Desktop */}
      <aside className="hidden w-[256px] shrink-0 border-r border-[var(--atai-line)]/60 bg-[var(--atai-white)] lg:sticky lg:top-0 lg:block lg:h-screen">
        {sidebarContent}
      </aside>

      {/* Drawer Mobile */}
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[var(--atai-navy)]/30"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative z-10 h-full w-[256px] bg-[var(--atai-white)] shadow-lg">
            {sidebarContent}
          </aside>
        </div>
      ) : null}

      {/* Área Principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[68px] shrink-0 items-center justify-between gap-4 border-b border-[var(--atai-line)]/50 bg-[var(--atai-white)] px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-[6px] p-1.5 text-[var(--atai-navy)] hover:bg-[var(--atai-bg)] lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <p className="truncate text-[14px] leading-[1.45] text-[var(--atai-muted)]">
              {breadcrumb}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-5">
            <Link
              href="/demo"
              className="text-[13px] font-medium text-[var(--atai-muted)] hover:text-[var(--atai-navy)] transition-colors"
            >
              Roteiros demo
            </Link>
            <Link
              href="/ajuda"
              className="text-[14px] font-semibold text-[var(--atai-blue)] hover:underline"
            >
              Ajuda
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 lg:p-12">
          <div className="mx-auto flex w-full max-w-[1088px] flex-col gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-[30px] font-semibold leading-[1.3] text-[var(--atai-navy)]">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-[15px] leading-[1.45] text-[var(--atai-muted)]">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
