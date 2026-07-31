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
    ativo: boolean;
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

const stepDescriptions = [
  "Informe o documento do cliente",
  "Dados de identificação do cliente",
  "Informações de contato e valores",
  "Confira os dados antes de salvar",
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
  const [ativo, setAtivo] = useState(true);
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
        setAtivo(editingCliente.ativo);
        lastFetchedCnpj.current = digits;
        setCnpjStatus("idle");
      } else {
        setDocType("cnpj");
        setDocValue("");
        setNome("");
        setResponsavel("");
        setEmail("");
        setHonorarioPadrao(0);
        setAtivo(true);
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
          ativo,
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
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        {steps.map((s, i) => (
          <button
            key={i}
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
  );

  const renderStepHeader = () => (
    <div className="flex items-center gap-3 mb-5">
      <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(0,174,239,0.1)]">
        <span className="material-symbols-outlined text-[#00AEEF] text-[20px]">
          {steps[step].icon}
        </span>
      </div>
      <div>
        <h3 className="text-[var(--text-primary)] text-[16px] font-semibold">
          {steps[step].title}
        </h3>
        <p className="text-[var(--text-tertiary)] text-[13px]">
          {stepDescriptions[step]}
        </p>
      </div>
    </div>
  );

  const renderStep0 = () => (
    <div className="space-y-5">
      <div>
        <label className="text-[var(--text-primary)] text-[15px] font-medium block mb-3">
          Tipo de Documento
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["cpf", "cnpj"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => handleDocTypeChange(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                docType === type
                  ? "border-[#00AEEF] bg-[rgba(0,174,239,0.05)]"
                  : "border-[var(--border-primary)] hover:border-[var(--text-tertiary)]"
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">
                {type === "cpf" ? "person" : "business"}
              </span>
              <span className="text-[14px] font-semibold">{type.toUpperCase()}</span>
              <span className="text-[12px] text-[var(--text-tertiary)]">
                {type === "cpf" ? "Pessoa Fisica" : "Pessoa Juridica"}
              </span>
            </button>
          ))}
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

      <label
        className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
          ativo
            ? "border-[#34C759] bg-[rgba(52,199,89,0.05)]"
            : "border-[var(--border-primary)] hover:border-[var(--text-tertiary)]"
        }`}
      >
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
          className="mt-0.5 size-[18px] accent-[#34C759] cursor-pointer"
        />
        <span>
          <span className="block text-[var(--text-primary)] text-[14px] font-semibold">
            Empresa ativa
          </span>
          <span className="block text-[var(--text-tertiary)] text-[12px] mt-0.5">
            Empresas inativas não entram na emissão de recibos em lote.
          </span>
        </span>
      </label>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border-primary)] overflow-hidden">
        {/* Section 1 - Documento */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[20px]">badge</span>
            <div>
              <p className="text-[12px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
                Documento
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-[#00AEEF] text-white uppercase">
                  {docType}
                </span>
                <span className="text-[14px] font-medium text-[var(--text-primary)] font-mono">
                  {docValue}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>

        {/* Section 2 - Identificação */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[20px]">person</span>
            <div>
              <p className="text-[12px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
                Identificação
              </p>
              <p className="text-[14px] font-medium text-[var(--text-primary)] mt-0.5">{nome}</p>
              {responsavel && (
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                  Responsável: {responsavel}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>

        {/* Section 3 - Contato e Valores */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[20px]">mail</span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[12px] text-[var(--text-tertiary)] font-medium uppercase tracking-wider">
                  Contato e Valores
                </p>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ativo ? "bg-[#34C759] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                  }`}
                >
                  {ativo ? "Ativa" : "Inativa"}
                </span>
              </div>
              <p className="text-[14px] text-[var(--text-primary)] mt-0.5">
                {email || <span className="text-[var(--text-tertiary)] italic">Nenhum e-mail informado</span>}
              </p>
              {honorarioPadrao > 0 && (
                <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">
                  Honorário padrão: R$ {honorarioPadrao.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[#00AEEF] transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </button>
        </div>
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

      <div className="min-h-[280px]">
        {renderStepHeader()}
        {renderCurrentStep()}
      </div>

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

        <span className="text-[var(--text-tertiary)] text-[13px] font-medium">
          {step + 1} de {steps.length}
        </span>

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
            icon={editingCliente ? "save" : "check"}
          >
            {editingCliente ? "Atualizar" : "Cadastrar"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
