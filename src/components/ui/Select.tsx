"use client";

import { SelectHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  hint?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, required, hint, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-[var(--text-primary)] text-[15px] font-medium">
            {label}
            {required && <span className="text-[#FF3B30] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full h-[52px] px-4 pr-12 rounded-xl appearance-none cursor-pointer",
              "bg-[var(--surface-primary)]",
              "border border-[var(--border-primary)]",
              "text-[var(--text-primary)] text-[16px]",
              "transition-all duration-200",
              "focus:outline-none focus:border-[#00AEEF]",
              "focus:ring-4 focus:ring-[rgba(0,174,239,0.15)]",
              error && "border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[rgba(255,59,48,0.15)]",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className={cn(
            "pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 transition-colors duration-200",
            isFocused ? "text-[#00AEEF]" : "text-[var(--text-tertiary)]"
          )}>
            <span className="material-symbols-outlined text-[20px]">expand_more</span>
          </div>
        </div>
        {hint && !error && (
          <p className="text-[13px] text-[var(--text-tertiary)]">{hint}</p>
        )}
        {error && (
          <p className="text-[13px] text-[#FF3B30] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
