import React from "react";

interface FieldWrapperProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({
  label,
  htmlFor,
  required,
  description,
  error,
  className = "",
  children,
}: FieldWrapperProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="text-[14px] font-medium leading-[1.45] text-[var(--atai-navy)]"
      >
        {label}
        {required ? " *" : ""}
      </label>
      {description ? (
        <p className="text-[13px] leading-[1.45] text-[var(--atai-muted)]">
          {description}
        </p>
      ) : null}
      {children}
      {error ? (
        <p className="text-[13px] leading-[1.4] text-[var(--atai-red)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const INPUT_BASE =
  "w-full min-h-[44px] rounded-[8px] border bg-[var(--atai-white)] px-3.5 py-2.5 text-[15px] text-[var(--atai-navy)] placeholder:text-[var(--atai-muted)]/80 focus:outline-none focus:ring-2 transition-colors disabled:bg-[#f7f4ec] disabled:text-[var(--atai-muted)] disabled:cursor-not-allowed";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({
  hasError = false,
  className = "",
  ...props
}: InputProps) {
  const borderClass = hasError
    ? "border-[var(--atai-blue)] focus:border-[var(--atai-blue)] focus:ring-[var(--atai-blue)]/15"
    : "border-[var(--atai-line)] focus:border-[var(--atai-blue)] focus:ring-[var(--atai-blue)]/15";

  return <input className={`${INPUT_BASE} ${borderClass} ${className}`} {...props} />;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({
  hasError = false,
  className = "",
  children,
  ...props
}: SelectProps) {
  const borderClass = hasError
    ? "border-[var(--atai-red)] focus:border-[var(--atai-red)] focus:ring-[var(--atai-red)]/15"
    : "border-[var(--atai-line)] focus:border-[var(--atai-blue)] focus:ring-[var(--atai-blue)]/15";

  return (
    <select className={`${INPUT_BASE} ${borderClass} ${className}`} {...props}>
      {children}
    </select>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({
  hasError = false,
  className = "",
  ...props
}: TextareaProps) {
  const borderClass = hasError
    ? "border-[var(--atai-red)] focus:border-[var(--atai-red)] focus:ring-[var(--atai-red)]/15"
    : "border-[var(--atai-line)] focus:border-[var(--atai-blue)] focus:ring-[var(--atai-blue)]/15";

  return (
    <textarea
      className={`w-full rounded-[8px] border bg-[var(--atai-white)] p-4 text-[15px] leading-[1.5] text-[var(--atai-navy)] placeholder:text-[var(--atai-muted)]/80 focus:outline-none focus:ring-2 transition-colors ${borderClass} ${className}`}
      {...props}
    />
  );
}
