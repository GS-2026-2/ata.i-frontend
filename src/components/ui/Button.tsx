import React from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "ghost";

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-[8px] px-4 py-2.5 min-h-[44px] text-[14px] font-medium leading-none transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--atai-green)] text-white hover:bg-[var(--atai-green-hover)] border border-transparent",
  secondary:
    "bg-[var(--atai-white)] text-[var(--atai-navy)] border border-[var(--atai-line)] hover:bg-[#faf7f0]",
  ghost:
    "bg-transparent text-[var(--atai-blue)] border border-transparent hover:bg-[var(--atai-info)]/60",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: React.ReactNode;
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
