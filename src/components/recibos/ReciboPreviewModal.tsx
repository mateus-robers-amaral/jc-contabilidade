"use client";

import { Modal } from "@/components/ui";
import type { Recibo } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ReciboPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recibo: Recibo | null;
  onEdit: (recibo: Recibo) => void;
  onSendEmail: (recibo: Recibo) => void;
}

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatDoc(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11)
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const statusConfig: Record<
  Recibo["status"],
  { label: string; bg: string; text: string }
> = {
  pendente: { label: "Pendente", bg: "bg-[#FF9500]/10", text: "text-[#FF9500]" },
  pago: { label: "Pago", bg: "bg-[#34C759]/10", text: "text-[#34C759]" },
  cancelado: { label: "Cancelado", bg: "bg-[#FF3B30]/10", text: "text-[#FF3B30]" },
};

export default function ReciboPreviewModal({
  isOpen,
  onClose,
  recibo,
  onEdit,
  onSendEmail,
}: ReciboPreviewModalProps) {
  if (!recibo) return null;

  const mesRef = new Date(recibo.mesReferencia);
  const mesNome = monthNames[mesRef.getUTCMonth()];
  const ano = mesRef.getUTCFullYear();

  const createdAt = new Date(recibo.createdAt);
  const emitidoEm = createdAt.toLocaleDateString("pt-BR");

  const status = statusConfig[recibo.status];

  const items: { label: string; value: number }[] = [
    { label: "Honorários Contábeis", value: recibo.honorario },
    { label: "13º Salário", value: recibo.decimoTerceiro },
    { label: "Taxa de Registro", value: recibo.registro },
    { label: "Alteração Contratual", value: recibo.alteracao },
    { label: "Material de Expediente", value: recibo.materialExpediente },
    { label: "Outros Serviços", value: recibo.outros },
  ].filter((item) => item.value > 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detalhes do Recibo" size="lg">
      <div className="space-y-6">
        {/* Client header */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center size-12 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-bold text-[16px] shrink-0">
            {recibo.cliente ? getInitials(recibo.cliente.nome) : "??"}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[var(--text-primary)] font-semibold text-[16px] truncate">
              {recibo.cliente?.nome ?? "Cliente não encontrado"}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {recibo.cliente?.cnpj && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]">
                  {formatDoc(recibo.cliente.cnpj)}
                </span>
              )}
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${status.bg} ${status.text}`}
              >
                {status.label}
              </span>
            </div>
          </div>
        </div>

        {/* Reference month */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--bg-tertiary)]">
          <span className="material-symbols-outlined text-[22px] text-[#00AEEF]">
            calendar_month
          </span>
          <div>
            <p className="text-[var(--text-tertiary)] text-[12px]">Mês de Referência</p>
            <p className="text-[var(--text-primary)] font-semibold text-[15px]">
              {mesNome} {ano}
            </p>
          </div>
        </div>

        {/* Values table */}
        <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden">
          <div className="divide-y divide-[var(--border-primary)]">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-[var(--text-tertiary)] text-[14px]">
                  {item.label}
                </span>
                <span className="text-[var(--text-primary)] font-medium text-[14px]">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-[var(--border-primary)] flex items-center justify-between px-4 py-4 bg-[var(--bg-tertiary)]">
            <span className="text-[var(--text-primary)] font-bold text-[16px]">
              TOTAL
            </span>
            <span className="text-[#00AEEF] font-bold text-[20px]">
              {formatCurrency(recibo.total)}
            </span>
          </div>
        </div>

        {/* Notes section */}
        {recibo.detalhamento && (
          <div className="flex gap-3 p-4 rounded-2xl bg-[#FF9500]/5 border border-[#FF9500]/20">
            <span className="material-symbols-outlined text-[20px] text-[#FF9500] shrink-0 mt-0.5">
              sticky_note_2
            </span>
            <div>
              <p className="text-[var(--text-primary)] font-medium text-[13px] mb-1">
                Observações
              </p>
              <p className="text-[var(--text-tertiary)] text-[13px] whitespace-pre-wrap">
                {recibo.detalhamento}
              </p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center justify-between text-[12px] text-[var(--text-tertiary)]">
          <span>Emitido em {emitidoEm}</span>
          <span>Recibo #{recibo.id.slice(0, 6).toUpperCase()}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--border-primary)]">
          <a
            href={`/api/recibos/${recibo.id}/pdf`}
            download
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00AEEF] text-white font-semibold text-[14px] hover:bg-[#00AEEF]/90 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download PDF
          </a>
          <button
            onClick={() => onSendEmail(recibo)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] font-semibold text-[14px] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">mail</span>
            Enviar E-mail
          </button>
          <button
            onClick={() => onEdit(recibo)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--text-tertiary)] font-medium text-[14px] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-colors ml-auto"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Editar
          </button>
        </div>
      </div>
    </Modal>
  );
}
