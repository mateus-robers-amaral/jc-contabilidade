"use client";

import { useState, useEffect } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { Settings, ApiResponse } from "@/types";

const pixKeyTypeOptions = [
  { value: "", label: "Selecione o tipo de chave" },
  { value: "cpf", label: "CPF" },
  { value: "cnpj", label: "CNPJ" },
  { value: "email", label: "E-mail" },
  { value: "phone", label: "Telefone" },
  { value: "random", label: "Chave Aleatoria" },
];

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    pixKeyType: "",
    pixKey: "",
    pixNomeBeneficiario: "",
    pixCidade: "",
    endereco: "",
    telefone: "",
    whatsapp: "",
    email: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      const data: ApiResponse<Settings> = await res.json();

      if (data.success && data.data) {
        setFormData({
          pixKeyType: data.data.pixKeyType || "",
          pixKey: data.data.pixKey || "",
          pixNomeBeneficiario: data.data.pixNomeBeneficiario || "",
          pixCidade: data.data.pixCidade || "",
          endereco: data.data.endereco || "",
          telefone: data.data.telefone || "",
          whatsapp: data.data.whatsapp || "",
          email: data.data.email || "",
        });
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setSaving(true);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        setError(data.error || "Erro ao salvar configuracoes");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao conectar com o servidor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
          Configuracoes
        </h1>
        <p className="text-[var(--text-tertiary)] text-[15px]">
          Gerencie as configuracoes do sistema e informacoes da empresa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        {/* PIX Section */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(0,174,239,0.1)]">
              <span className="material-symbols-outlined text-[#00AEEF] text-[22px]">
                qr_code_2
              </span>
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] text-[18px] font-semibold">
                PIX
              </h2>
              <p className="text-[var(--text-tertiary)] text-[13px]">
                Configuracoes para geracao de QR Code PIX nos recibos
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de Chave PIX"
                options={pixKeyTypeOptions}
                value={formData.pixKeyType}
                onChange={(e) =>
                  setFormData({ ...formData, pixKeyType: e.target.value })
                }
              />

              <Input
                label="Chave PIX"
                placeholder="Digite a chave PIX"
                value={formData.pixKey}
                onChange={(e) =>
                  setFormData({ ...formData, pixKey: e.target.value })
                }
                hint="A chave conforme o tipo selecionado"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nome do Beneficiario"
                placeholder="Ex: JC Contabilidade"
                value={formData.pixNomeBeneficiario}
                onChange={(e) =>
                  setFormData({ ...formData, pixNomeBeneficiario: e.target.value })
                }
                hint="Nome que aparecera no QR Code (max 25 caracteres)"
              />

              <Input
                label="Cidade"
                placeholder="Ex: Sao Paulo"
                value={formData.pixCidade}
                onChange={(e) =>
                  setFormData({ ...formData, pixCidade: e.target.value })
                }
                hint="Cidade do beneficiario (max 15 caracteres)"
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(46,49,146,0.1)]">
              <span className="material-symbols-outlined text-[#2E3192] text-[22px]">
                contact_page
              </span>
            </div>
            <div>
              <h2 className="text-[var(--text-primary)] text-[18px] font-semibold">
                Informacoes de Contato
              </h2>
              <p className="text-[var(--text-tertiary)] text-[13px]">
                Dados que serao exibidos no rodape dos recibos PDF
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <Input
              label="Endereco"
              placeholder="Ex: Rua das Flores, 123 - Centro - Sao Paulo/SP"
              value={formData.endereco}
              onChange={(e) =>
                setFormData({ ...formData, endereco: e.target.value })
              }
              icon="location_on"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Telefone"
                placeholder="(11) 1234-5678"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                icon="call"
              />

              <Input
                label="WhatsApp"
                placeholder="(11) 91234-5678"
                value={formData.whatsapp}
                onChange={(e) =>
                  setFormData({ ...formData, whatsapp: e.target.value })
                }
                icon="chat"
              />
            </div>

            <Input
              label="E-mail"
              type="email"
              placeholder="contato@jccontabilidade.com.br"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              icon="mail"
            />
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
            <span className="material-symbols-outlined text-[20px]">error</span>
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(52,199,89,0.1)] border border-[rgba(52,199,89,0.2)] text-[#34C759] text-[14px]">
            <span className="material-symbols-outlined text-[20px]">
              check_circle
            </span>
            Configuracoes salvas com sucesso!
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" loading={saving} icon={saving ? undefined : "save"}>
            {saving ? "Salvando..." : "Salvar Configuracoes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
