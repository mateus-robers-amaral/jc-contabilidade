"use client";

import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: DrawerProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-[560px] z-50 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-full flex flex-col bg-[var(--surface-primary)] shadow-2xl border-l border-[var(--border-primary)] transition-theme">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-primary)] shrink-0">
            <div>
              <h2 className="text-[var(--text-primary)] text-[22px] font-bold leading-tight tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="text-[var(--text-tertiary)] text-[14px] mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center size-10 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 px-6 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
