"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import type { Recibo } from "@/types";
import { formatCurrency } from "@/lib/utils";

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

function formatDoc(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11)
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

const statusConfig: Record<Recibo["status"], { label: string; bg: string; text: string }> = {
  pendente: { label: "Pendente", bg: "bg-[rgba(255,149,0,0.1)]", text: "text-[#FF9500]" },
  pago: { label: "Pago", bg: "bg-[rgba(52,199,89,0.1)]", text: "text-[#34C759]" },
  cancelado: { label: "Cancelado", bg: "bg-[rgba(255,59,48,0.1)]", text: "text-[#FF3B30]" },
};

type ViewMode = "details" | "pdf";

export default function ReciboPreviewModal({
  isOpen,
  onClose,
  recibo,
  onEdit,
  onSendEmail,
}: ReciboPreviewModalProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("details");
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !recibo) return null;

  const mesRef = new Date(recibo.mesReferencia);
  const mesNome = MONTH_NAMES[mesRef.getUTCMonth()];
  const ano = mesRef.getUTCFullYear();
  const emitidoEm = new Date(recibo.createdAt).toLocaleDateString("pt-BR");
  const status = statusConfig[recibo.status];
  const pdfUrl = `/api/recibos/${recibo.id}/pdf`;

  const items = [
    { label: "Honorários Contábeis", value: Number(recibo.honorario) },
    { label: "13º Salário", value: Number(recibo.decimoTerceiro) },
    { label: "Taxa de Registro", value: Number(recibo.registro) },
    { label: "Alteração Contratual", value: Number(recibo.alteracao) },
    { label: "Material de Expediente", value: Number(recibo.materialExpediente) },
    { label: "Outros Serviços", value: Number(recibo.outros) },
  ].filter((item) => item.value > 0);

  const handleClose = () => {
    setViewMode("details");
    setIsFullscreen(false);
    onClose();
  };

  // Fullscreen PDF viewer
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-[var(--surface-primary)] border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-bold text-[12px]">
              {recibo.cliente ? getInitials(recibo.cliente.nome) : "??"}
            </div>
            <div>
              <p className="text-[var(--text-primary)] text-[15px] font-semibold">{recibo.cliente?.nome}</p>
              <p className="text-[var(--text-tertiary)] text-[12px]">Recibo #{recibo.id.slice(0, 6).toUpperCase()} — {mesNome} {ano}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={pdfUrl} download>
              <Button icon="download" size="sm">Baixar PDF</Button>
            </a>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center justify-center size-10 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              title="Sair da tela cheia"
            >
              <span className="material-symbols-outlined text-[22px]">fullscreen_exit</span>
            </button>
            <button
              onClick={handleClose}
              className="flex items-center justify-center size-10 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>
        {/* PDF */}
        <div className="flex-1">
          <iframe src={pdfUrl} className="w-full h-full" title="Recibo PDF" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

      <div className="relative w-full max-w-4xl bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl shadow-2xl animate-fadeIn transition-theme flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-bold text-[15px]">
              {recibo.cliente ? getInitials(recibo.cliente.nome) : "??"}
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] text-[18px] font-bold">
                {recibo.cliente?.nome ?? "Cliente"}
              </h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[var(--text-tertiary)] text-[13px]">
                  Recibo #{recibo.id.slice(0, 6).toUpperCase()}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* View mode toggle */}
            <div className="flex rounded-lg overflow-hidden border border-[var(--border-primary)] mr-2">
              <button
                onClick={() => setViewMode("details")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  viewMode === "details" ? "bg-[#00AEEF] text-white" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">list_alt</span>
                Detalhes
              </button>
              <button
                onClick={() => setViewMode("pdf")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  viewMode === "pdf" ? "bg-[#00AEEF] text-white" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                PDF
              </button>
            </div>
            <button
              onClick={handleClose}
              className="flex items-center justify-center size-10 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {viewMode === "details" ? (
            <div className="p-6 space-y-5">
              {/* Reference + Client info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                  <span className="material-symbols-outlined text-[#00AEEF] text-[28px]">calendar_month</span>
                  <div>
                    <p className="text-[var(--text-tertiary)] text-[11px] font-semibold uppercase tracking-wider">Referência</p>
                    <p className="text-[var(--text-primary)] text-[17px] font-bold">{mesNome} {ano}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                  <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[28px]">info</span>
                  <div>
                    <p className="text-[var(--text-tertiary)] text-[11px] font-semibold uppercase tracking-wider">Documento</p>
                    <p className="text-[var(--text-primary)] text-[15px] font-medium font-mono">
                      {recibo.cliente?.cnpj ? formatDoc(recibo.cliente.cnpj) : "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Values */}
              <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden">
                <div className="px-5 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
                  <span className="text-[var(--text-secondary)] text-[12px] font-semibold uppercase tracking-wider">Discriminação dos Serviços</span>
                </div>
                <div className="divide-y divide-[var(--border-primary)]">
                  {items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between px-5 py-3">
                      <span className="text-[var(--text-secondary)] text-[14px]">{item.label}</span>
                      <span className="text-[var(--text-primary)] text-[14px] font-semibold font-mono">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[rgba(0,174,239,0.08)] to-[rgba(46,49,146,0.05)] border-t border-[var(--border-primary)]">
                  <span className="text-[var(--text-primary)] text-[16px] font-bold">TOTAL</span>
                  <span className="text-[#00AEEF] text-[22px] font-bold">{formatCurrency(Number(recibo.total))}</span>
                </div>
              </div>

              {/* Notes */}
              {recibo.detalhamento && (
                <div className="flex gap-3 p-4 rounded-xl bg-[#fffbeb] border-l-4 border-[#f59e0b]">
                  <span className="material-symbols-outlined text-[#f59e0b] text-[20px] mt-0.5">notes</span>
                  <div>
                    <p className="text-[#92400e] text-[12px] font-semibold uppercase tracking-wider mb-1">Observações</p>
                    <p className="text-[#78350f] text-[13px] leading-relaxed whitespace-pre-wrap">{recibo.detalhamento}</p>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center justify-between text-[12px] text-[var(--text-tertiary)] pt-2">
                <span>Emitido em {emitidoEm}</span>
                {recibo.cliente?.email && (
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">mail</span>
                    {recibo.cliente.email}
                  </span>
                )}
              </div>
            </div>
          ) : (
            /* PDF View */
            <div className="relative" style={{ height: "65vh" }}>
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-primary)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[12px] font-medium shadow-md hover:bg-[var(--bg-tertiary)] transition-colors"
                title="Tela cheia"
              >
                <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                Tela cheia
              </button>
              <iframe src={pdfUrl} className="w-full h-full rounded-b-3xl" title="Recibo PDF" />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[var(--border-primary)]">
          <a href={pdfUrl} download>
            <Button icon="download" size="sm">Baixar PDF</Button>
          </a>
          <button
            onClick={() => onSendEmail(recibo)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-[13px] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            Enviar E-mail
          </button>
          <button
            onClick={() => onEdit(recibo)}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[var(--text-tertiary)] text-[13px] font-medium hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Editar
          </button>
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[var(--text-tertiary)] text-[13px] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
