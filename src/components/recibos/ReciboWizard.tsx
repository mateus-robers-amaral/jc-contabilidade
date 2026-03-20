"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, SearchableSelect, CurrencyInput, Modal } from "@/components/ui";
import { formatCurrency, getInitials } from "@/lib/utils";
import type { Recibo, Cliente } from "@/types";

const MATERIAL_EXPEDIENTE = 5.0;

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const steps = [
  { title: "Cliente", icon: "person" },
  { title: "Referência", icon: "calendar_month" },
  { title: "Valores", icon: "payments" },
  { title: "Revisão", icon: "checklist" },
];

interface ReciboWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientes: Cliente[];
  editingRecibo?: Recibo | null;
}

interface FormData {
  mesReferencia: string;
  honorario: number;
  decimoTerceiro: number;
  registro: number;
  alteracao: number;
  outros: number;
  detalhamento: string;
}

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getDefaultFormData(): FormData {
  return {
    mesReferencia: getCurrentMonth(),
    honorario: 0,
    decimoTerceiro: 0,
    registro: 0,
    alteracao: 0,
    outros: 0,
    detalhamento: "",
  };
}

export default function ReciboWizard({
  isOpen,
  onClose,
  onSuccess,
  clientes,
  editingRecibo,
}: ReciboWizardProps) {
  const [step, setStep] = useState(0);
  const [clienteId, setClienteId] = useState("");
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editingRecibo;
  const selectedCliente = clientes.find((c) => c.id === clienteId);

  const total =
    formData.honorario +
    formData.decimoTerceiro +
    formData.registro +
    formData.alteracao +
    MATERIAL_EXPEDIENTE +
    formData.outros;

  const resetState = useCallback(() => {
    setStep(0);
    setError("");
    setLoading(false);

    if (editingRecibo) {
      setClienteId(editingRecibo.clienteId);
      const d = new Date(editingRecibo.mesReferencia);
      const formatted = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      setFormData({
        mesReferencia: formatted,
        honorario: editingRecibo.honorario,
        decimoTerceiro: editingRecibo.decimoTerceiro,
        registro: editingRecibo.registro,
        alteracao: editingRecibo.alteracao,
        outros: editingRecibo.outros,
        detalhamento: editingRecibo.detalhamento || "",
      });
    } else {
      setClienteId("");
      setFormData(getDefaultFormData());
    }
  }, [editingRecibo]);

  useEffect(() => {
    if (isOpen) resetState();
  }, [isOpen, resetState]);

  const canProceed = () => {
    switch (step) {
      case 0:
        return clienteId !== "";
      case 1:
        return true;
      case 2:
        return formData.honorario > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const body = {
        clienteId,
        mesReferencia: formData.mesReferencia,
        honorario: formData.honorario,
        decimoTerceiro: formData.decimoTerceiro,
        registro: formData.registro,
        alteracao: formData.alteracao,
        outros: formData.outros,
        detalhamento: formData.detalhamento || null,
        ...(isEditing && { status: editingRecibo!.status }),
      };

      const url = isEditing
        ? `/api/recibos/${editingRecibo!.id}`
        : "/api/recibos";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao salvar recibo");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar recibo");
    } finally {
      setLoading(false);
    }
  };

  const formatMonth = (value: string) => {
    const [year, month] = value.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  };

  const valueItems = [
    { label: "Honorários Contábeis", value: formData.honorario },
    { label: "13º Salário", value: formData.decimoTerceiro },
    { label: "Taxa de Registro", value: formData.registro },
    { label: "Alteração Contratual", value: formData.alteracao },
    { label: "Material de Expediente", value: MATERIAL_EXPEDIENTE },
    { label: "Outros Serviços", value: formData.outros },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Recibo" : "Novo Recibo"}
      description={`Passo ${step + 1} de ${steps.length} — ${steps[step].title}`}
      size="xl"
    >
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.title} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center justify-center size-10 rounded-xl transition-all duration-200 shrink-0 ${
                i === step
                  ? "bg-[#00AEEF] text-white"
                  : i < step
                    ? "bg-[#34C759] text-white cursor-pointer"
                    : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {i < step ? "check" : s.icon}
              </span>
            </button>
            <span
              className={`text-[13px] font-medium hidden sm:block ${
                i === step
                  ? "text-[var(--text-primary)]"
                  : i < step
                    ? "text-[#34C759]"
                    : "text-[var(--text-tertiary)]"
              }`}
            >
              {s.title}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-[2px] rounded-full mx-1 ${
                  i < step ? "bg-[#34C759]" : "bg-[var(--border-primary)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {/* Step 0 — Cliente */}
        {step === 0 && (
          <div className="space-y-4">
            <SearchableSelect
              label="Cliente"
              options={clientes.map((c) => ({
                value: c.id,
                label: c.nome,
                sublabel: c.cnpj,
              }))}
              value={clienteId}
              onChange={(val) => {
                setClienteId(val);
                if (!isEditing) {
                  const cliente = clientes.find((c) => c.id === val);
                  if (cliente?.honorarioPadrao) {
                    setFormData((prev) => ({ ...prev, honorario: Number(cliente.honorarioPadrao) }));
                  }
                }
              }}
              searchPlaceholder="Buscar por nome ou documento..."
              required
            />

            {selectedCliente && (
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#0078A8] text-white text-[15px] font-bold shrink-0">
                  {getInitials(selectedCliente.nome)}
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-primary)] text-[15px] font-semibold truncate">
                    {selectedCliente.nome}
                  </p>
                  <p className="text-[var(--text-tertiary)] text-[13px]">
                    {selectedCliente.cnpj}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Referência */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <span className="text-[var(--text-primary)] text-[15px] font-medium">
                Mês de Referência
              </span>
              <input
                type="month"
                value={formData.mesReferencia}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, mesReferencia: e.target.value }))
                }
                className="w-full h-[52px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 text-[var(--text-primary)] text-[15px] font-medium focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] transition-all"
              />
            </div>

            <div className="flex items-center gap-3 p-5 rounded-2xl bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.2)]">
              <span className="material-symbols-outlined text-[#00AEEF] text-[28px]">
                calendar_month
              </span>
              <span className="text-[var(--text-primary)] text-[20px] font-bold">
                {formatMonth(formData.mesReferencia)}
              </span>
            </div>
          </div>
        )}

        {/* Step 2 — Valores */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput
                label="Honorários Contábeis"
                value={formData.honorario}
                onChange={(val) => setFormData((prev) => ({ ...prev, honorario: val }))}
                required
              />
              <CurrencyInput
                label="13º Salário"
                value={formData.decimoTerceiro}
                onChange={(val) => setFormData((prev) => ({ ...prev, decimoTerceiro: val }))}
              />
              <CurrencyInput
                label="Taxa de Registro"
                value={formData.registro}
                onChange={(val) => setFormData((prev) => ({ ...prev, registro: val }))}
              />
              <CurrencyInput
                label="Alteração Contratual"
                value={formData.alteracao}
                onChange={(val) => setFormData((prev) => ({ ...prev, alteracao: val }))}
              />
              <CurrencyInput
                label="Material de Expediente"
                value={MATERIAL_EXPEDIENTE}
                onChange={() => {}}
                disabled
              />
              <CurrencyInput
                label="Outros Serviços"
                value={formData.outros}
                onChange={(val) => setFormData((prev) => ({ ...prev, outros: val }))}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.2)]">
              <span className="text-[var(--text-secondary)] text-[15px] font-medium">Total</span>
              <span className="text-[#00AEEF] text-[24px] font-bold">
                {formatCurrency(total)}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[var(--text-primary)] text-[15px] font-medium">
                Detalhamento / Observações
              </span>
              <textarea
                value={formData.detalhamento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, detalhamento: e.target.value }))
                }
                rows={3}
                placeholder="Observações adicionais..."
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl p-4 text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] transition-all resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 3 — Revisão */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Client Info */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-12 rounded-xl bg-gradient-to-br from-[#00AEEF] to-[#0078A8] text-white text-[15px] font-bold shrink-0">
                  {selectedCliente ? getInitials(selectedCliente.nome) : "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-[var(--text-primary)] text-[15px] font-semibold truncate">
                    {selectedCliente?.nome}
                  </p>
                  <p className="text-[var(--text-tertiary)] text-[13px]">
                    {selectedCliente?.cnpj}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(0)}
                className="flex items-center justify-center size-9 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {/* Reference Month Badge */}
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.2)]">
                <span className="material-symbols-outlined text-[#00AEEF] text-[18px]">
                  calendar_month
                </span>
                <span className="text-[#00AEEF] text-[15px] font-semibold">
                  {formatMonth(formData.mesReferencia)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center size-9 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
            </div>

            {/* Values Table */}
            <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-tertiary)] border-b border-[var(--border-primary)]">
                <span className="text-[var(--text-secondary)] text-[13px] font-semibold uppercase tracking-wider">
                  Valores
                </span>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center justify-center size-7 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>
              <div className="divide-y divide-[var(--border-primary)]">
                {valueItems
                  .filter((item) => item.value > 0)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <span className="text-[var(--text-secondary)] text-[14px]">
                        {item.label}
                      </span>
                      <span className="text-[var(--text-primary)] text-[14px] font-medium">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
              </div>
              <div className="flex items-center justify-between px-4 py-4 bg-[rgba(0,174,239,0.08)] border-t border-[rgba(0,174,239,0.2)]">
                <span className="text-[var(--text-secondary)] text-[15px] font-medium">
                  Total
                </span>
                <span className="text-[#00AEEF] text-[20px] font-bold">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            {/* Detalhamento */}
            {formData.detalhamento && (
              <div className="p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[18px]">
                    notes
                  </span>
                  <span className="text-[var(--text-secondary)] text-[13px] font-semibold uppercase tracking-wider">
                    Observações
                  </span>
                </div>
                <p className="text-[var(--text-primary)] text-[14px] leading-relaxed">
                  {formData.detalhamento}
                </p>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)]">
                <span className="material-symbols-outlined text-[#FF3B30] text-[18px]">
                  error
                </span>
                <span className="text-[#FF3B30] text-[14px]">{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-[var(--border-primary)]">
        <Button
          variant="secondary"
          onClick={() => setStep((prev) => prev - 1)}
          disabled={step === 0}
          icon="arrow_back"
        >
          Voltar
        </Button>

        {step < steps.length - 1 ? (
          <Button
            onClick={() => setStep((prev) => prev + 1)}
            disabled={!canProceed()}
            icon="arrow_forward"
            iconPosition="right"
          >
            Próximo
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            loading={loading}
            icon={isEditing ? "save" : "receipt_long"}
          >
            {isEditing ? "Atualizar" : "Emitir Recibo"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
