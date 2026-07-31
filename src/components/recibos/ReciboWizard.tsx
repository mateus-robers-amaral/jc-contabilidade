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
  { title: "Cliente", icon: "person", description: "Escolha para quem emitir o recibo" },
  { title: "Referência", icon: "calendar_month", description: "Período de competência do recibo" },
  { title: "Valores", icon: "payments", description: "Informe os valores dos serviços" },
  { title: "Revisão", icon: "checklist", description: "Confira os dados antes de emitir" },
];

const stepHeaders = [
  { title: "Selecione o cliente", description: "Escolha para quem emitir o recibo", icon: "person" },
  { title: "Mês de referência", description: "Período de competência do recibo", icon: "calendar_month" },
  { title: "Valores do recibo", description: "Informe os valores dos serviços", icon: "payments" },
  { title: "Revisão final", description: "Confira os dados antes de emitir", icon: "checklist" },
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
  materialExpediente: number;
  outros: number;
  detalhamento: string;
}

interface AvulsoData {
  nome: string;
  cnpj: string;
  email: string;
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
    materialExpediente: MATERIAL_EXPEDIENTE,
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
  const [isAvulso, setIsAvulso] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [avulsoData, setAvulsoData] = useState<AvulsoData>({ nome: "", cnpj: "", email: "" });
  const [formData, setFormData] = useState<FormData>(getDefaultFormData());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEditing = !!editingRecibo;
  const selectedCliente = clientes.find((c) => c.id === clienteId);

  const materialValue = isAvulso ? formData.materialExpediente : MATERIAL_EXPEDIENTE;

  const total =
    formData.honorario +
    formData.decimoTerceiro +
    formData.registro +
    formData.alteracao +
    materialValue +
    formData.outros;

  const resetState = useCallback(() => {
    setStep(0);
    setError("");
    setLoading(false);

    if (editingRecibo) {
      const editIsAvulso = !editingRecibo.clienteId;
      setIsAvulso(editIsAvulso);
      setClienteId(editingRecibo.clienteId || "");
      setAvulsoData({
        nome: editingRecibo.avulsoNome || "",
        cnpj: editingRecibo.avulsoCnpj || "",
        email: editingRecibo.avulsoEmail || "",
      });
      const d = new Date(editingRecibo.mesReferencia);
      const formatted = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      setFormData({
        mesReferencia: formatted,
        honorario: Number(editingRecibo.honorario) || 0,
        decimoTerceiro: Number(editingRecibo.decimoTerceiro) || 0,
        registro: Number(editingRecibo.registro) || 0,
        alteracao: Number(editingRecibo.alteracao) || 0,
        materialExpediente: Number(editingRecibo.materialExpediente) || MATERIAL_EXPEDIENTE,
        outros: Number(editingRecibo.outros) || 0,
        detalhamento: editingRecibo.detalhamento || "",
      });
    } else {
      setIsAvulso(false);
      setClienteId("");
      setAvulsoData({ nome: "", cnpj: "", email: "" });
      setFormData(getDefaultFormData());
    }
  }, [editingRecibo]);

  useEffect(() => {
    if (isOpen) resetState();
  }, [isOpen, resetState]);

  const canProceed = () => {
    switch (step) {
      case 0:
        return isAvulso
          ? avulsoData.nome.trim() !== "" && avulsoData.cnpj.trim() !== ""
          : clienteId !== "";
      case 1:
        return true;
      case 2:
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    // Recibo avulso: abre a aba do PDF já no clique (antes de qualquer await),
    // senão o bloqueador de pop-up barra a abertura depois do fetch.
    const pdfTab = isAvulso && !isEditing ? window.open("", "_blank") : null;
    setLoading(true);
    setError("");

    try {
      const body = {
        ...(isAvulso
          ? { avulsoNome: avulsoData.nome.trim(), avulsoCnpj: avulsoData.cnpj.replace(/\D/g, ""), avulsoEmail: avulsoData.email.trim() || null }
          : { clienteId }),
        mesReferencia: formData.mesReferencia,
        honorario: formData.honorario,
        decimoTerceiro: formData.decimoTerceiro,
        registro: formData.registro,
        alteracao: formData.alteracao,
        outros: formData.outros,
        detalhamento: formData.detalhamento || null,
        ...(isAvulso && { materialExpediente: formData.materialExpediente }),
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

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar recibo");
      }

      // Abre o PDF do recibo avulso recém-emitido na aba já aberta no clique.
      if (pdfTab) {
        const novoId = data?.data?.id;
        if (novoId) pdfTab.location.href = `/api/recibos/${novoId}/pdf`;
        else pdfTab.close();
      }

      onSuccess();
      onClose();
    } catch (err) {
      if (pdfTab && !pdfTab.closed) pdfTab.close();
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
    { label: "Material de Expediente", value: materialValue },
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
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          {steps.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-2 text-[13px] font-medium transition-colors ${
                i === step
                  ? "text-[#00AEEF]"
                  : i < step
                    ? "text-[#34C759] cursor-pointer"
                    : "text-[var(--text-tertiary)]"
              }`}
            >
              <span
                className={`flex items-center justify-center size-7 rounded-full text-[11px] font-bold ${
                  i < step
                    ? "bg-[#34C759] text-white"
                    : i === step
                      ? "bg-[#00AEEF] text-white"
                      : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                }`}
              >
                {i < step ? (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                ) : (
                  i + 1
                )}
              </span>
              <span className="hidden sm:inline">{s.title}</span>
            </button>
          ))}
        </div>
        <div className="h-1 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00AEEF] rounded-full transition-all duration-300"
            style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[280px]">
        {/* Step Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(0,174,239,0.1)]">
            <span className="material-symbols-outlined text-[#00AEEF] text-[20px]">
              {stepHeaders[step].icon}
            </span>
          </div>
          <div>
            <h3 className="text-[var(--text-primary)] text-[16px] font-semibold">
              {stepHeaders[step].title}
            </h3>
            <p className="text-[var(--text-tertiary)] text-[13px]">
              {stepHeaders[step].description}
            </p>
          </div>
        </div>

        {/* Step 0 — Cliente */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Toggle: Cadastrado / Avulso */}
            {!isEditing && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAvulso(false); setAvulsoData({ nome: "", cnpj: "", email: "" }); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    !isAvulso
                      ? "border-[#00AEEF] bg-[rgba(0,174,239,0.05)]"
                      : "border-[var(--border-primary)] hover:border-[var(--text-tertiary)]"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${!isAvulso ? "text-[#00AEEF]" : "text-[var(--text-tertiary)]"}`}>person</span>
                  <div className="text-left">
                    <p className={`text-[14px] font-semibold ${!isAvulso ? "text-[#00AEEF]" : "text-[var(--text-primary)]"}`}>Cliente cadastrado</p>
                    <p className="text-[var(--text-tertiary)] text-[11px]">Selecionar da base</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAvulso(true); setClienteId(""); }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isAvulso
                      ? "border-[#FF9500] bg-[rgba(255,149,0,0.05)]"
                      : "border-[var(--border-primary)] hover:border-[var(--text-tertiary)]"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[22px] ${isAvulso ? "text-[#FF9500]" : "text-[var(--text-tertiary)]"}`}>person_off</span>
                  <div className="text-left">
                    <p className={`text-[14px] font-semibold ${isAvulso ? "text-[#FF9500]" : "text-[var(--text-primary)]"}`}>Serviço avulso</p>
                    <p className="text-[var(--text-tertiary)] text-[11px]">Dados apenas no recibo</p>
                  </div>
                </button>
              </div>
            )}

            {/* Cliente cadastrado */}
            {!isAvulso && (
              <>
                <SearchableSelect
                  label="Cliente"
                  options={clientes.map((c) => ({
                    value: c.id,
                    label: c.ativo === false ? `${c.nome} — Inativa` : c.nome,
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
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white text-[18px] font-bold shrink-0">
                      {getInitials(selectedCliente.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[var(--text-primary)] text-[16px] font-semibold truncate">{selectedCliente.nome}</p>
                        {selectedCliente.ativo === false && (
                          <span className="inline-flex shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[var(--bg-secondary)] text-[var(--text-tertiary)]">
                            Inativa
                          </span>
                        )}
                      </div>
                      <p className="text-[var(--text-tertiary)] text-[13px] font-mono">{selectedCliente.cnpj}</p>
                      {selectedCliente.honorarioPadrao && (
                        <p className="text-[#00AEEF] text-[13px] font-medium mt-1">
                          Honorário padrão: {formatCurrency(Number(selectedCliente.honorarioPadrao))}
                        </p>
                      )}
                    </div>
                    <span className="material-symbols-outlined text-[#34C759] text-[24px]">check_circle</span>
                  </div>
                )}
              </>
            )}

            {/* Serviço avulso */}
            {isAvulso && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgba(255,149,0,0.08)] border border-[rgba(255,149,0,0.15)] text-[13px] text-[var(--text-secondary)]">
                  <span className="material-symbols-outlined text-[#FF9500] text-[18px] mt-0.5">info</span>
                  <span>Os dados informados abaixo serão usados <strong>apenas neste recibo</strong> e não serão salvos na base de clientes.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[var(--text-primary)] text-[14px] font-medium">Nome / Razão Social <span className="text-[#FF3B30]">*</span></label>
                  <input
                    type="text"
                    value={avulsoData.nome}
                    onChange={(e) => setAvulsoData((prev) => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo ou razão social"
                    className="w-full h-[48px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[var(--text-primary)] text-[14px] font-medium">CPF / CNPJ <span className="text-[#FF3B30]">*</span></label>
                  <input
                    type="text"
                    value={avulsoData.cnpj}
                    onChange={(e) => setAvulsoData((prev) => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className="w-full h-[48px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 text-[var(--text-primary)] text-[14px] font-mono placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] transition-all"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[var(--text-primary)] text-[14px] font-medium">E-mail</label>
                  <input
                    type="email"
                    value={avulsoData.email}
                    onChange={(e) => setAvulsoData((prev) => ({ ...prev, email: e.target.value }))}
                    placeholder="email@exemplo.com"
                    className="w-full h-[48px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 text-[var(--text-primary)] text-[14px] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] transition-all"
                  />
                </div>
                {avulsoData.nome && avulsoData.cnpj && (
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)]">
                    <div className="flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-[#FF9500] to-[#FF6B00] text-white text-[18px] font-bold shrink-0">
                      {getInitials(avulsoData.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[var(--text-primary)] text-[16px] font-semibold truncate">{avulsoData.nome}</p>
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-[rgba(255,149,0,0.15)] text-[#FF9500] text-[10px] font-bold uppercase">Avulso</span>
                      </div>
                      <p className="text-[var(--text-tertiary)] text-[13px] font-mono">{avulsoData.cnpj}</p>
                    </div>
                    <span className="material-symbols-outlined text-[#34C759] text-[24px]">check_circle</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 1 — Referência */}
        {step === 1 && (() => {
          const [selYear, selMonth] = formData.mesReferencia.split("-").map(Number);
          const currentYear = new Date().getFullYear();
          const years = [currentYear - 1, currentYear, currentYear + 1];

          return (
            <div className="space-y-5">
              {/* Year selector */}
              <div className="flex items-center justify-center gap-2">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, mesReferencia: `${y}-${String(selMonth).padStart(2, "0")}` }))}
                    className={`px-5 py-2.5 rounded-xl text-[15px] font-semibold transition-all ${
                      selYear === y
                        ? "bg-[#00AEEF] text-white shadow-md"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-primary)] border border-[var(--border-primary)]"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>

              {/* Month grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {MONTH_NAMES.map((name, i) => {
                  const monthNum = i + 1;
                  const isSelected = selMonth === monthNum;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, mesReferencia: `${selYear}-${String(monthNum).padStart(2, "0")}` }))}
                      className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl text-[13px] font-medium transition-all ${
                        isSelected
                          ? "bg-[#00AEEF] text-white shadow-md"
                          : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-primary)]"
                      }`}
                    >
                      <span className="text-[15px] font-semibold">{name.slice(0, 3)}</span>
                      <span className={`text-[11px] ${isSelected ? "text-white/70" : "text-[var(--text-tertiary)]"}`}>{name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Selected display */}
              <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.15)]">
                <span className="material-symbols-outlined text-[#00AEEF] text-[24px]">event</span>
                <span className="text-[var(--text-primary)] text-[18px] font-bold">{formatMonth(formData.mesReferencia)}</span>
              </div>
            </div>
          );
        })()}

        {/* Step 2 — Valores */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CurrencyInput
                label="Honorários Contábeis"
                value={formData.honorario}
                onChange={(val) => setFormData((prev) => ({ ...prev, honorario: val }))}
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
                value={materialValue}
                onChange={(val) => setFormData((prev) => ({ ...prev, materialExpediente: val }))}
                disabled={!isAvulso}
              />
              <CurrencyInput
                label="Outros Serviços"
                value={formData.outros}
                onChange={(val) => setFormData((prev) => ({ ...prev, outros: val }))}
              />
            </div>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-[rgba(0,174,239,0.1)] to-[rgba(46,49,146,0.1)] border border-[rgba(0,174,239,0.2)]">
              <div>
                <span className="text-[var(--text-tertiary)] text-[12px] font-semibold uppercase tracking-wider">
                  Total do Recibo
                </span>
              </div>
              <span className="text-[#00AEEF] text-[28px] font-bold">
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
            {/* Unified review card */}
            <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden">
              {/* Client section */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-xl text-white flex items-center justify-center text-[14px] font-bold ${
                    isAvulso ? "bg-gradient-to-br from-[#FF9500] to-[#FF6B00]" : "bg-gradient-to-br from-[#00AEEF] to-[#2E3192]"
                  }`}>
                    {isAvulso ? getInitials(avulsoData.nome) : selectedCliente ? getInitials(selectedCliente.nome) : "?"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[var(--text-primary)] text-[15px] font-semibold">
                        {isAvulso ? avulsoData.nome : selectedCliente?.nome}
                      </p>
                      {isAvulso && (
                        <span className="px-2 py-0.5 rounded-md bg-[rgba(255,149,0,0.15)] text-[#FF9500] text-[10px] font-bold uppercase">Avulso</span>
                      )}
                    </div>
                    <p className="text-[var(--text-tertiary)] text-[12px] font-mono">
                      {isAvulso ? avulsoData.cnpj : selectedCliente?.cnpj}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>

              {/* Month section */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00AEEF] text-[18px]">
                    calendar_month
                  </span>
                  <span className="text-[var(--text-primary)] text-[14px] font-semibold">
                    {formatMonth(formData.mesReferencia)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="size-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              </div>

              {/* Values */}
              <div className="divide-y divide-[var(--border-primary)]">
                {valueItems
                  .filter((item) => item.value > 0)
                  .map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <span className="text-[var(--text-secondary)] text-[14px]">
                        {item.label}
                      </span>
                      <span className="text-[var(--text-primary)] text-[14px] font-semibold font-mono">
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  ))}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[rgba(0,174,239,0.08)] to-[rgba(46,49,146,0.05)]">
                <span className="text-[var(--text-primary)] text-[15px] font-semibold">
                  Total
                </span>
                <span className="text-[#00AEEF] text-[22px] font-bold">
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
      <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[var(--border-primary)]">
        <Button
          variant="secondary"
          onClick={() => setStep((prev) => prev - 1)}
          disabled={step === 0}
          icon="arrow_back"
        >
          Voltar
        </Button>

        <span className="text-[var(--text-tertiary)] text-[13px] font-medium">
          {step + 1} de {steps.length}
        </span>

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
