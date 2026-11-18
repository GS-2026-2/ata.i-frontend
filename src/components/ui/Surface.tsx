import React from "react";

type BadgeVariant = "success" | "info" | "danger" | "neutral";

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-[var(--atai-pale)] text-[var(--atai-green)]",
  info: "bg-[var(--atai-info)] text-[var(--atai-blue)]",
  danger: "bg-[var(--atai-error)] text-[var(--atai-red)]",
  neutral:
    "bg-[var(--atai-bg)] text-[var(--atai-muted)] border border-[var(--atai-line)]",
};

export function Badge({
  variant = "info",
  className = "",
  children,
}: {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[6px] px-2.5 py-1.5 text-[12px] font-semibold leading-none tracking-[0.01em] ${BADGE_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

type BannerVariant = "info" | "success" | "error";

const BANNER_CLASSES: Record<BannerVariant, string> = {
  info: "bg-[var(--atai-info)] text-[var(--atai-navy)]",
  success: "bg-[var(--atai-pale)] text-[var(--atai-navy)]",
  error: "bg-[var(--atai-error)] text-[var(--atai-red)]",
};

export function Banner({
  variant = "info",
  className = "",
  children,
}: {
  variant?: BannerVariant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`w-full rounded-[8px] px-4 py-4 text-[14px] leading-[1.45] ${BANNER_CLASSES[variant]} ${className}`}
    >
      {children}
    </div>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[8px] border border-[var(--atai-line)] bg-[var(--atai-white)] p-6 ${className}`}
    >
      {children}
    </div>
  );
}

export function KpiCard({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-[32px] font-semibold leading-[1.2] text-[var(--atai-navy)]">
        {value}
      </p>
      <p className="text-[14px] leading-[1.45] text-[var(--atai-muted)]">
        {label}
      </p>
    </Card>
  );
}
