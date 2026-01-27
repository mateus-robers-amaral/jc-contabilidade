"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SearchableSelectProps {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SearchableSelect({
  label,
  error,
  options,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  required,
  value,
  onChange,
  className,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((option) => {
    const searchLower = search.toLowerCase();
    return (
      option.label.toLowerCase().includes(searchLower) ||
      (option.sublabel && option.sublabel.toLowerCase().includes(searchLower))
    );
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="flex flex-col gap-2" ref={containerRef}>
      {label && (
        <span className="text-[var(--text-primary)] text-[15px] font-medium leading-normal">
          {label}
          {required && <span className="text-[#FF3B30] ml-1">*</span>}
        </span>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex w-full items-center justify-between rounded-xl text-[var(--text-primary)]",
            "focus:outline-none focus:ring-4 focus:ring-[rgba(0,174,239,0.15)]",
            "border border-[var(--border-primary)] bg-[var(--surface-primary)] focus:border-[#00AEEF]",
            "h-[52px] px-4 text-[16px] font-normal transition-all duration-200 text-left",
            error && "border-[#FF3B30] focus:border-[#FF3B30] focus:ring-[rgba(255,59,48,0.15)]",
            !selectedOption && "text-[var(--text-tertiary)]",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className={cn(
            "material-symbols-outlined text-[var(--text-tertiary)] transition-transform duration-200",
            isOpen && "rotate-180"
          )}>
            expand_more
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl shadow-xl overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-[var(--border-primary)]">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] text-[20px]">
                  search
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[14px] focus:outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[rgba(0,174,239,0.15)] transition-all"
                />
              </div>
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-[var(--text-tertiary)] text-[14px]">
                  <span className="material-symbols-outlined text-[28px] mb-1 block">search_off</span>
                  Nenhum resultado encontrado
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full px-4 py-3 text-left hover:bg-[var(--bg-tertiary)] transition-colors flex flex-col gap-0.5",
                      option.value === value && "bg-[rgba(0,174,239,0.1)] border-l-2 border-[#00AEEF]"
                    )}
                  >
                    <span className={cn(
                      "text-[14px] font-medium",
                      option.value === value ? "text-[#00AEEF]" : "text-[var(--text-primary)]"
                    )}>
                      {option.label}
                    </span>
                    {option.sublabel && (
                      <span className="text-[12px] text-[var(--text-tertiary)]">
                        {option.sublabel}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="text-[13px] text-[#FF3B30] flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">error</span>
          {error}
        </p>
      )}
    </div>
  );
}
