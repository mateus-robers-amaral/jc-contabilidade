"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: string;
  iconPosition?: "left" | "right";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary: cn(
        "bg-[#00AEEF] text-white",
        "hover:bg-[#0095CC]",
        "shadow-[0_2px_8px_rgba(0,174,239,0.3)]",
        "hover:shadow-[0_4px_16px_rgba(0,174,239,0.4)]",
        "active:bg-[#007CAA]"
      ),
      secondary: cn(
        "bg-[var(--bg-tertiary)] text-[var(--text-primary)]",
        "hover:bg-[var(--bg-secondary)]",
        "border border-[var(--border-primary)]"
      ),
      outline: cn(
        "bg-transparent text-[#00AEEF]",
        "border-2 border-[#00AEEF]",
        "hover:bg-[rgba(0,174,239,0.1)]"
      ),
      danger: cn(
        "bg-[rgba(255,59,48,0.1)] text-[#FF3B30]",
        "hover:bg-[rgba(255,59,48,0.2)]",
        "border border-[rgba(255,59,48,0.2)]"
      ),
      ghost: cn(
        "bg-transparent text-[var(--text-secondary)]",
        "hover:bg-[var(--bg-tertiary)]",
        "hover:text-[var(--text-primary)]"
      ),
    };

    const sizes = {
      sm: "h-9 px-4 text-[13px] gap-1.5",
      md: "h-11 px-5 text-[15px] gap-2",
      lg: "h-[52px] px-7 text-[17px] gap-2.5",
    };

    const iconSizes = {
      sm: "text-[16px]",
      md: "text-[18px]",
      lg: "text-[20px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center",
          "rounded-xl font-semibold",
          "transition-all duration-200 ease-out",
          "active:scale-[0.98]",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
          "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(0,174,239,0.3)]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <span className={cn("material-symbols-outlined animate-spin", iconSizes[size])}>
            progress_activity
          </span>
        ) : icon && iconPosition === "left" ? (
          <span className={cn("material-symbols-outlined", iconSizes[size])}>{icon}</span>
        ) : null}
        {children}
        {!loading && icon && iconPosition === "right" ? (
          <span className={cn("material-symbols-outlined", iconSizes[size])}>{icon}</span>
        ) : null}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
