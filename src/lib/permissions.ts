import type { TipoUsuario } from "@/types/domain";

export interface NavItem {
  label: string;
  href: string;
  tag?: string;
}

export function getHomeRouteForRole(tipo: TipoUsuario): string {
  return tipo === "SUPERADMIN" ? "/admin/escolas" : "/prioridades";
}

export function getSidebarHeaderLabel(tipo: TipoUsuario): string {
  return tipo === "SUPERADMIN" ? "ADMINISTRAÇÃO" : "GESTÃO ESCOLAR";
}

export function getNavItemsForRole(tipo: TipoUsuario): NavItem[] {
  switch (tipo) {
    case "SUPERADMIN":
      return [
        { label: "Gerenciar escolas", href: "/admin/escolas" },
        { label: "Gerenciar usuários", href: "/admin/usuarios" },
      ];
    case "DIRETOR":
      return [
        { label: "Prioridades da escola", href: "/prioridades" },
        { label: "Reuniões e rascunhos", href: "/reunioes" },
        { label: "Histórico de decisões", href: "/historico" },
        { label: "Prestação de contas", href: "/prestacao-de-contas", tag: "Futuro" },
      ];
    case "COORDENADOR":
      return [
        { label: "Prioridades da escola", href: "/prioridades" },
        { label: "Reuniões e rascunhos", href: "/reunioes" },
        { label: "Histórico de decisões", href: "/historico" },
      ];
    case "PROFESSOR":
      return [{ label: "Prioridades da escola", href: "/prioridades" }];
  }
}

export function canAccessRoute(tipo: TipoUsuario, pathname: string): boolean {
  if (pathname === "/ajuda" || pathname === "/demo") {
    return true;
  }

  if (tipo === "SUPERADMIN") {
    return pathname.startsWith("/admin");
  }

  if (pathname.startsWith("/admin")) {
    return false;
  }

  if (tipo === "PROFESSOR") {
    return pathname === "/prioridades" || pathname.startsWith("/prioridades/");
  }

  if (tipo === "COORDENADOR") {
    if (pathname.includes("/confirmar") || pathname.startsWith("/prestacao-de-contas")) {
      return false;
    }
    return true;
  }

  // DIRETOR has access to all school routes
  return true;
}

export function canRegisterMeeting(tipo: TipoUsuario): boolean {
  return tipo === "DIRETOR" || tipo === "COORDENADOR";
}

export function canConfirmAta(tipo: TipoUsuario): boolean {
  return tipo === "DIRETOR";
}

export function canViewAtaDetail(tipo: TipoUsuario): boolean {
  return tipo === "DIRETOR" || tipo === "COORDENADOR";
}
