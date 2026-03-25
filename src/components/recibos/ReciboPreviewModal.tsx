"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Recibo } from "@/types";

interface ReciboPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recibo: Recibo | null;
  onEdit: (recibo: Recibo) => void;
  onSendEmail: (recibo: Recibo) => void;
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function ReciboPreviewModal({
  isOpen,
  onClose,
  recibo,
  onEdit,
  onSendEmail,
}: ReciboPreviewModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !recibo) return null;

  const mesRef = new Date(recibo.mesReferencia);
  const mesNome = MONTH_NAMES[mesRef.getUTCMonth()];
  const ano = mesRef.getUTCFullYear();
  const pdfUrl = `/api/recibos/${recibo.id}/pdf`;
  const reciboAvulso = !recibo.clienteId;
  const clienteNome = recibo.cliente?.nome || recibo.avulsoNome || "Cliente removido";

  const handleClose = () => {
    setIsFullscreen(false);
    onClose();
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `recibo_${recibo.id.slice(0, 6)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const statusLabel = recibo.status === "pago" ? "Pago" : recibo.status === "cancelado" ? "Cancelado" : "Pendente";
  const statusColor = recibo.status === "pago" ? "#34C759" : recibo.status === "cancelado" ? "#FF3B30" : "#FF9500";

  // Fullscreen mode
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-primary)] border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center size-9 rounded-lg text-white font-bold text-[11px] ${reciboAvulso ? "bg-gradient-to-br from-[#FF9500] to-[#FF6B00]" : "bg-gradient-to-br from-[#00AEEF] to-[#2E3192]"}`}>
              {getInitials(clienteNome)}
            </div>
            <div>
              <p className="text-[var(--text-primary)] text-[14px] font-semibold">{clienteNome}{reciboAvulso ? " (Avulso)" : ""}</p>
              <p className="text-[var(--text-tertiary)] text-[11px]">{mesNome} {ano} — #{recibo.id.slice(0, 6).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} icon="download" size="sm" variant="secondary">Baixar</Button>
            <button onClick={() => onSendEmail(recibo)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-[13px] font-medium hover:bg-[var(--bg-tertiary)] transition-colors">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              E-mail
            </button>
            <button onClick={() => setIsFullscreen(false)}
              className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Sair da tela cheia">
              <span className="material-symbols-outlined text-[20px]">fullscreen_exit</span>
            </button>
            <button onClick={handleClose}
              className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1">
          <iframe src={pdfUrl} className="w-full h-full" title="Recibo PDF" />
        </div>
      </div>
    );
  }

  // Normal modal — PDF viewer
  return (
    <div className="fixed inset-0 z-50 flex flex-col p-4 md:p-8">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative flex flex-col w-full h-full max-w-5xl mx-auto z-10">
        {/* Header */}
        <div className="flex items-center justify-between bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-t-2xl px-5 py-3">
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center size-10 rounded-xl text-white font-bold text-[13px] ${reciboAvulso ? "bg-gradient-to-br from-[#FF9500] to-[#FF6B00]" : "bg-gradient-to-br from-[#00AEEF] to-[#2E3192]"}`}>
              {getInitials(clienteNome)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[var(--text-primary)] text-[16px] font-bold">{clienteNome}</h2>
                {reciboAvulso && <span className="px-2 py-0.5 rounded-md bg-[rgba(255,149,0,0.15)] text-[#FF9500] text-[10px] font-bold uppercase">Avulso</span>}
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: `${statusColor}15`, color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
              <p className="text-[var(--text-tertiary)] text-[12px]">{mesNome} {ano} — Recibo #{recibo.id.slice(0, 6).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownload} icon="download" size="sm">Baixar PDF</Button>
            <button onClick={() => onSendEmail(recibo)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-[13px] font-medium hover:bg-[var(--bg-tertiary)] transition-colors">
              <span className="material-symbols-outlined text-[16px]">mail</span>
              E-mail
            </button>
            <button onClick={() => onEdit(recibo)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[var(--text-tertiary)] text-[13px] font-medium hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Editar
            </button>
            <div className="w-px h-6 bg-[var(--border-primary)] mx-1" />
            <button onClick={() => setIsFullscreen(true)}
              className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Tela cheia">
              <span className="material-symbols-outlined text-[20px]">fullscreen</span>
            </button>
            <button onClick={handleClose}
              className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* PDF iframe */}
        <div className="flex-1 bg-[var(--bg-tertiary)] border-x border-b border-[var(--border-primary)] rounded-b-2xl overflow-hidden">
          <iframe src={pdfUrl} className="w-full h-full" title="Recibo PDF" />
        </div>
      </div>
    </div>
  );
}
