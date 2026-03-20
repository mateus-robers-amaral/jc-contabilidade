"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input, CurrencyInput, Modal } from "@/components/ui";

type DocType = "cpf" | "cnpj";

interface ClienteWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingCliente?: {
    id: string;
    nome: string;
    cnpj: string;
    email: string | null;
    responsavel: string | null;
    honorarioPadrao: number | null;
  } | null;
}

interface CNPJData {
  razao_social: string;
  nome_fantasia: string;
  email: string;
}

function maskCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function maskCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

const steps = [
  { title: "Documento", icon: "badge" },
  { title: "Identificação", icon: "person" },
  { title: "Contato e Valores", icon: "mail" },
  { title: "Revisão", icon: "checklist" },
];

export default function ClienteWizard({
  isOpen,
  onClose,
  onSuccess,
  editingCliente,
}: ClienteWizardProps) {
  const [step, setStep] = useState(0);
  const [docType, setDocType] = useState<DocType>("cnpj");
  const [docValue, setDocValue] = useState("");
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [email, setEmail] = useState("");
  const [honorarioPadrao, setHonorarioPadrao] = useState(0);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"idle" | "found" | "not_found" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const lastFetchedCnpj = useRef("");
  const prevIsOpen = useRef(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      if (editingCliente) {
        const digits = editingCliente.cnpj.replace(/\D/g, "");
        const type: DocType = digits.length <= 11 ? "cpf" : "cnpj";
        setDocType(type);
        setDocValue(type === "cpf" ? maskCPF(digits) : maskCNPJ(digits));
        setNome(editingCliente.nome);
        setResponsavel(editingCliente.responsavel || "");
        setEmail(editingCliente.email || "");
        setHonorarioPadrao(editingCliente.honorarioPadrao ? Number(editingCliente.honorarioPadrao) : 0);
        lastFetchedCnpj.current = digits;
        setCnpjStatus("idle");
      } else {
        setDocType("cnpj");
        setDocValue("");
        setNome("");
        setResponsavel("");
        setEmail("");
        setHonorarioPadrao(0);
        setCnpjStatus("idle");
        lastFetchedCnpj.current = "";
      }
      setStep(0);
      setSubmitting(false);
      setFormError("");
      setCnpjLoading(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, editingCliente]);

  const digits = docValue.replace(/\D/g, "");

  const fetchCNPJData = useCallback(
    async (cnpjDigits: string) => {
      if (cnpjDigits.length !== 14 || cnpjDigits === lastFetchedCnpj.current) return;
      lastFetchedCnpj.current = cnpjDigits;
      setCnpjLoading(true);
      setCnpjStatus("idle");

      try {
        const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
        if (!res.ok) {
          setCnpjStatus("not_found");
          return;
        }
        const data: CNPJData = await res.json();
        setCnpjStatus("found");
        setNome((prev) => data.razao_social || data.nome_fantasia || prev);
        setEmail((prev) => (data.email && data.email !== "" ? data.email : prev));
      } catch {
        setCnpjStatus("error");
      } finally {
        setCnpjLoading(false);
      }
    },
    []
  );

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = docType === "cpf" ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
    setDocValue(masked);

    const rawDigits = masked.replace(/\D/g, "");
    if (!editingCliente && docType === "cnpj" && rawDigits.length === 14) {
      fetchCNPJData(rawDigits);
    } else {
      setCnpjStatus("idle");
    }
  };

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    setDocValue("");
    setCnpjStatus("idle");
    lastFetchedCnpj.current = "";
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0:
        return docType === "cpf" ? digits.length === 11 : digits.length === 14;
      case 1:
        return nome.trim().length > 0;
      case 2:
        return true;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < steps.length - 1 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setFormError("");
    setSubmitting(true);

    try {
      const url = editingCliente
        ? `/api/clientes/${editingCliente.id}`
        : "/api/clientes";
      const method = editingCliente ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nome.trim(),
          cnpj: digits,
          email: email.trim() || "",
          responsavel: responsavel.trim() || "",
          honorarioPadrao: honorarioPadrao > 0 ? honorarioPadrao : null,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setFormError(data.error || "Erro ao salvar cliente");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setFormError("Erro ao conectar com o servidor");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepper = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center size-10 rounded-full text-[14px] font-bold transition-colors ${
                i < step
                  ? "bg-[#34C759] text-white"
                  : i === step
                  ? "bg-[#00AEEF] text-white"
                  : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
              }`}
            >
              {i < step ? (
                <span className="material-symbols-outlined text-[20px]">check</span>
              ) : (
                i + 1
              )}
            </div>
            <span
              className={`text-[12px] font-medium whitespace-nowrap ${
                i <= step ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
              }`}
            >
              {s.title}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-[2px] mx-3 mt-[-24px] rounded-full transition-colors ${
                i < step ? "bg-[#34C759]" : "bg-[var(--bg-tertiary)]"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep0 = () => (
    <div className="space-y-5">
      <div>
        <label className="text-[var(--text-primary)] text-[15px] font-medium block mb-3">
          Tipo de Documento
        </label>
        <div className="flex rounded-lg overflow-hidden border border-[var(--border-primary)]">
          <button
            type="button"
            onClick={() => handleDocTypeChange("cpf")}
            className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
              docType === "cpf"
                ? "bg-[#00AEEF] text-white"
                : "bg-[var(--surface-primary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            CPF
          </button>
          <button
            type="button"
            onClick={() => handleDocTypeChange("cnpj")}
            className={`px-4 py-2 text-[13px] font-semibold transition-colors ${
              docType === "cnpj"
                ? "bg-[#00AEEF] text-white"
                : "bg-[var(--surface-primary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)]"
            }`}
          >
            CNPJ
          </button>
        </div>
      </div>

      <Input
        label={docType === "cpf" ? "CPF" : "CNPJ"}
        placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
        value={docValue}
        onChange={handleDocChange}
        icon="badge"
        required
      />

      {cnpjLoading && (
        <div className="flex items-center gap-2 text-[13px] text-[#00AEEF]">
          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
          Buscando dados do CNPJ...
        </div>
      )}
      {cnpjStatus === "found" && !cnpjLoading && (
        <div className="flex items-center gap-2 text-[13px] text-[#34C759]">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          CNPJ encontrado - dados preenchidos automaticamente
        </div>
      )}
      {cnpjStatus === "not_found" && !cnpjLoading && (
        <div className="flex items-center gap-2 text-[13px] text-[#FF9500]">
          <span className="material-symbols-outlined text-[16px]">warning</span>
          CNPJ não encontrado na base da Receita Federal
        </div>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-5">
      <Input
        label="Nome / Razão Social"
        placeholder="Ex: JC Solucoes Tecnologicas Ltda"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        icon="business"
        required
      />
      <Input
        label="Nome do Responsável"
        placeholder="Ex: João Silva"
        value={responsavel}
        onChange={(e) => setResponsavel(e.target.value)}
        icon="person"
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      <Input
        label="E-mail para Faturamento"
        type="email"
        placeholder="financeiro@empresa.com.br"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        icon="mail"
      />
      <div>
        <CurrencyInput
          label="Honorário Padrão Mensal"
          value={honorarioPadrao}
          onChange={(val) => setHonorarioPadrao(val)}
        />
        <p className="text-[var(--text-tertiary)] text-[12px] mt-1.5 ml-1">
          Valor pré-preenchido ao criar recibos. Também usado na emissão em lote.
        </p>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      {/* Documento */}
      <div className="rounded-xl bg-[var(--bg-tertiary)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Documento
          </span>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="flex items-center justify-center size-7 rounded-lg hover:bg-[var(--surface-primary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#00AEEF] text-white uppercase">
            {docType}
          </span>
          <span className="text-[15px] font-medium text-[var(--text-primary)] font-mono">
            {docValue}
          </span>
        </div>
      </div>

      {/* Identificação */}
      <div className="rounded-xl bg-[var(--bg-tertiary)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Identificação
          </span>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center justify-center size-7 rounded-lg hover:bg-[var(--surface-primary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>
        <p className="text-[15px] font-medium text-[var(--text-primary)]">{nome}</p>
        {responsavel && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Responsável: {responsavel}
          </p>
        )}
      </div>

      {/* Contato e Valores */}
      <div className="rounded-xl bg-[var(--bg-tertiary)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Contato e Valores
          </span>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center justify-center size-7 rounded-lg hover:bg-[var(--surface-primary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>
        <p className="text-[15px] text-[var(--text-primary)]">
          {email || <span className="text-[var(--text-tertiary)] italic">Nenhum e-mail informado</span>}
        </p>
        {honorarioPadrao > 0 && (
          <p className="text-[13px] text-[var(--text-secondary)] mt-1">
            Honorário padrão: R$ {honorarioPadrao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        )}
      </div>

      {formError && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {formError}
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCliente ? "Editar Cliente" : "Novo Cliente"}
      description={`Passo ${step + 1} de ${steps.length} — ${steps[step].title}`}
      size="lg"
    >
      {renderStepper()}
      {renderCurrentStep()}

      {/* Navigation Footer */}
      <div className="flex items-center justify-between gap-3 pt-6 mt-6 border-t border-[var(--border-primary)]">
        <Button
          type="button"
          variant="secondary"
          onClick={handleBack}
          disabled={step === 0}
          icon="arrow_back"
        >
          Voltar
        </Button>

        <div className="flex items-center gap-3">
          {step < steps.length - 1 ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed()}
              icon="arrow_forward"
              iconPosition="right"
            >
              Próximo
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              loading={submitting}
              icon={editingCliente ? "save" : "add"}
            >
              {editingCliente ? "Atualizar" : "Cadastrar"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
