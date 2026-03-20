"use client";

import { forwardRef, useCallback } from "react";
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
    const cents = Math.round(value * 100);
    const displayValue = cents === 0 ? "" : formatFromCents(cents);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
      // Allow tab, escape, enter
      if (["Tab", "Escape", "Enter"].includes(e.key)) return;

      // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(e.key.toLowerCase())) return;

      // Always prevent default — we control the value
      e.preventDefault();

      if (/^\d$/.test(e.key)) {
        // Append digit: shift left and add
        const newCents = cents * 10 + parseInt(e.key);
        if (newCents <= 99999999) { // max R$ 999.999,99
          onChange?.(newCents / 100);
        }
      } else if (e.key === "Backspace") {
        // Remove last digit: shift right
        const newCents = Math.floor(cents / 10);
        onChange?.(newCents / 100);
      } else if (e.key === "Delete") {
        // Clear all
        onChange?.(0);
      }
    }, [cents, onChange]);

    // Block paste and manual input — only keyDown controls value
    const handleChange = useCallback(() => {}, []);

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
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] font-medium text-[var(--text-tertiary)]">
            R$
          </span>
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            autoComplete="off"
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
