"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  required?: boolean;
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, hint, required, type = "text", ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-[var(--text-primary)] text-[15px] font-medium">
            {label}
            {required && <span className="text-[#FF3B30] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && !isPassword && (
            <div className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200",
              isFocused ? "text-[#00AEEF]" : "text-[var(--text-tertiary)]"
            )}>
              <span className="material-symbols-outlined text-[20px]">{icon}</span>
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              "w-full h-[52px] px-4 rounded-xl",
              "bg-[var(--surface-primary)]",
              "border border-[var(--border-primary)]",
              "text-[var(--text-primary)] text-[16px]",
              "placeholder:text-[var(--text-tertiary)]",
              "transition-all duration-200",
              "focus:outline-none focus:border-[#00AEEF]",
              "focus:ring-4 focus:ring-[rgba(0,174,239,0.15)]",
              icon && !isPassword && "pl-12",
              (icon || isPassword) && "pr-12",
              error && "border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[rgba(255,59,48,0.15)]",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={cn(
                "absolute right-4 top-1/2 -translate-y-1/2",
                "text-[var(--text-tertiary)] hover:text-[#00AEEF]",
                "transition-colors duration-200"
              )}
            >
              <span className="material-symbols-outlined text-[20px]">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          )}
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

Input.displayName = "Input";

export default Input;
