"use client";

import { forwardRef, useRef } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  value?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function valueToCents(value: number): number {
  return Math.round(value * 100);
}

function formatFromCents(cents: number): string {
  const reais = Math.floor(cents / 100);
  const centavos = cents % 100;
  const reaisStr = reais.toLocaleString("pt-BR");
  return `${reaisStr},${String(centavos).padStart(2, "0")}`;
}

const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      required,
      value = 0,
      onChange,
      disabled,
      placeholder = "0,00",
      className,
    },
    ref
  ) => {
    const focusedRef = useRef(false);

    // Derive display directly from value prop — single source of truth
    const cents = valueToCents(value);
    const displayValue = cents === 0 && !focusedRef.current ? "" : formatFromCents(cents);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const digits = e.target.value.replace(/\D/g, "");
      const newCents = parseInt(digits, 10) || 0;
      onChange?.(newCents / 100);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (["Backspace", "Delete", "Tab", "Escape", "Enter", "ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;
      if (!/^\d$/.test(e.key)) {
        e.preventDefault();
      }
    };

    return (
      <label className={cn("flex flex-col gap-2", disabled && "opacity-60")}>
        {label && (
          <p className="text-[var(--text-primary)] text-[15px] font-medium leading-normal flex items-center justify-between">
            {label}
            {required && <span className="text-[#FF3B30] ml-1">*</span>}
            {disabled && (
              <span className="material-symbols-outlined text-[14px] text-[var(--text-tertiary)]">lock</span>
            )}
          </p>
        )}
        <div className="relative">
          <span className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium transition-colors duration-200",
            focusedRef.current ? "text-[#00AEEF]" : "text-[var(--text-tertiary)]"
          )}>
            R$
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => { focusedRef.current = true; }}
            onBlur={() => { focusedRef.current = false; }}
            disabled={disabled}
            placeholder={placeholder}
            className={cn(
              "flex w-full min-w-0 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]",
              "focus:outline-none focus:ring-4 focus:ring-[rgba(0,174,239,0.15)]",
              "border border-[var(--border-primary)] bg-[var(--surface-primary)] focus:border-[#00AEEF]",
              "h-[52px] pl-11 pr-4 text-[16px] font-normal transition-all duration-200 text-right",
              disabled && "cursor-not-allowed bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]",
              error && "border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[rgba(255,59,48,0.15)]",
              className
            )}
          />
        </div>
        {error && (
          <p className="text-[13px] text-[#FF3B30] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </p>
        )}
      </label>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export default CurrencyInput;
