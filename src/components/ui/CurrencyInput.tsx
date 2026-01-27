"use client";

import { forwardRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { numberToCurrency, parseCurrencyToNumber } from "@/lib/utils";

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
    const [displayValue, setDisplayValue] = useState(numberToCurrency(value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      setDisplayValue(numberToCurrency(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;

      // Remove everything except digits and comma
      let cleaned = rawValue.replace(/[^\d,]/g, "");

      // Ensure only one comma
      const commaIndex = cleaned.indexOf(",");
      if (commaIndex !== -1) {
        cleaned =
          cleaned.slice(0, commaIndex + 1) +
          cleaned.slice(commaIndex + 1).replace(/,/g, "");
      }

      // Limit decimal places to 2
      const parts = cleaned.split(",");
      if (parts[1] && parts[1].length > 2) {
        parts[1] = parts[1].slice(0, 2);
        cleaned = parts.join(",");
      }

      setDisplayValue(cleaned);

      // Convert to number for onChange
      const numericValue = parseCurrencyToNumber(cleaned);
      onChange?.(numericValue);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Format value on blur
      const numericValue = parseCurrencyToNumber(displayValue);
      setDisplayValue(numberToCurrency(numericValue));
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
            isFocused ? "text-[#00AEEF]" : "text-[var(--text-tertiary)]"
          )}>
            R$
          </span>
          <input
            ref={ref}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
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
