"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { getHomeRouteForRole } from "@/lib/permissions";

export default function HomePage() {
  const { session, loadingSession } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (loadingSession) return;
    if (!session) {
      router.replace("/login");
    } else {
      router.replace(getHomeRouteForRole(session.usuario.tipo));
    }
  }, [loadingSession, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--atai-bg)] text-[14px] text-[var(--atai-muted)]">
      Carregando ATA.I…
    </div>
  );
}
