"use client";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", page, "...", totalPages);
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] gap-4">
      <p className="text-[var(--text-tertiary)] text-[14px]">
        Mostrando {start}-{end} de {total} resultados
      </p>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center size-9 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:text-[#00AEEF] hover:border-[#00AEEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {getPageNumbers().map((pageNum, index) =>
          typeof pageNum === "string" ? (
            <span
              key={`ellipsis-${index}`}
              className="size-9 flex items-center justify-center text-[var(--text-tertiary)] text-[14px]"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={cn(
                "size-9 rounded-xl text-[14px] font-medium flex items-center justify-center transition-all",
                page === pageNum
                  ? "bg-[#00AEEF] text-white shadow-[0_2px_8px_rgba(0,174,239,0.3)]"
                  : "text-[var(--text-secondary)] hover:text-[#00AEEF] hover:bg-[rgba(0,174,239,0.1)]"
              )}
            >
              {pageNum}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center size-9 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:text-[#00AEEF] hover:border-[#00AEEF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
