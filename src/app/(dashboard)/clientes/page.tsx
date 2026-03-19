"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button, Input, Modal, Pagination } from "@/components/ui";
import { formatCNPJ, parseCNPJ, getInitials } from "@/lib/utils";
import type { Cliente, PaginatedResponse, ApiResponse } from "@/types";

type DocType = "cnpj" | "cpf";

interface CNPJData {
  razao_social: string;
  nome_fantasia: string;
  email: string;
  descricao_situacao_cadastral: string;
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

function formatDoc(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) return maskCPF(value);
  return maskCNPJ(value);
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Cliente | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    responsavel: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [docType, setDocType] = useState<DocType>("cnpj");
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjStatus, setCnpjStatus] = useState<"idle" | "found" | "not_found" | "error">("idle");
  const lastFetchedCnpj = useRef("");

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/clientes?${params}`);
      const data: ApiResponse<PaginatedResponse<Cliente>> = await res.json();

      if (data.success && data.data) {
        setClientes(data.data.data);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  // Auto-fetch CNPJ data when 14 digits are typed
  const fetchCNPJData = useCallback(async (cnpjDigits: string) => {
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
      setFormData((prev) => ({
        ...prev,
        nome: data.razao_social || data.nome_fantasia || prev.nome,
        email: data.email && data.email !== "" ? data.email : prev.email,
      }));
    } catch {
      setCnpjStatus("error");
    } finally {
      setCnpjLoading(false);
    }
  }, []);

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = docType === "cpf" ? maskCPF(e.target.value) : maskCNPJ(e.target.value);
    setFormData({ ...formData, cnpj: masked });

    const digits = masked.replace(/\D/g, "");
    if (docType === "cnpj" && digits.length === 14 && !editingCliente) {
      fetchCNPJData(digits);
    } else {
      setCnpjStatus("idle");
    }
  };

  const handleDocTypeChange = (type: DocType) => {
    setDocType(type);
    setFormData((prev) => ({ ...prev, cnpj: "" }));
    setCnpjStatus("idle");
    lastFetchedCnpj.current = "";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchClientes();
  };

  const openNewModal = () => {
    setEditingCliente(null);
    setFormData({ nome: "", cnpj: "", email: "", responsavel: "" });
    setDocType("cnpj");
    setFormError("");
    setCnpjStatus("idle");
    lastFetchedCnpj.current = "";
    setModalOpen(true);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingCliente(cliente);
    const digits = parseCNPJ(cliente.cnpj);
    const type: DocType = digits.length <= 11 ? "cpf" : "cnpj";
    setDocType(type);
    setFormData({
      nome: cliente.nome,
      cnpj: type === "cpf" ? maskCPF(digits) : formatCNPJ(digits),
      email: cliente.email || "",
      responsavel: cliente.responsavel || "",
    });
    setFormError("");
    setCnpjStatus("idle");
    lastFetchedCnpj.current = digits;
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const url = editingCliente
        ? `/api/clientes/${editingCliente.id}`
        : "/api/clientes";
      const method = editingCliente ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        setFormError(data.error || "Erro ao salvar cliente");
        return;
      }

      setModalOpen(false);
      fetchClientes();
    } catch {
      setFormError("Erro ao conectar com o servidor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/clientes/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setDeleteConfirm(null);
        fetchClientes();
      }
    } catch (error) {
      console.error("Error deleting cliente:", error);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
            Clientes
          </h1>
          <p className="text-[var(--text-tertiary)] text-[15px]">
            Gerencie sua base de clientes e emita recibos
          </p>
        </div>
        <Button onClick={openNewModal} icon="add">
          Novo Cliente
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[var(--surface-primary)] p-2 rounded-2xl border border-[var(--border-primary)] shadow-sm"
      >
        <div className="flex-1 min-w-[280px]">
          <div className="relative flex items-center h-12 w-full rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus-within:border-[#00AEEF] focus-within:ring-4 focus-within:ring-[rgba(0,174,239,0.15)] transition-all">
            <div className="absolute left-4 text-[var(--text-tertiary)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full bg-transparent pl-11 pr-4 rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none text-[14px] font-normal"
              placeholder="Buscar por nome ou CNPJ..."
            />
          </div>
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>
      </form>

      {/* Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-2/5">
                  Empresa
                </th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-2/5">
                  CPF/CNPJ
                </th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-1/5">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-secondary)]">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">
                      progress_activity
                    </span>
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-[var(--text-quaternary)]">
                          inbox
                        </span>
                      </div>
                      <p className="text-[var(--text-tertiary)] text-[15px]">
                        Nenhum cliente encontrado
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="group hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-semibold text-[12px]">
                          {getInitials(cliente.nome)}
                        </div>
                        <div>
                          <div className="text-[14px] font-medium text-[var(--text-primary)]">
                            {cliente.nome}
                          </div>
                          <div className="text-[12px] text-[var(--text-tertiary)]">
                            Cadastrado em{" "}
                            {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-mono">
                        {formatDoc(cliente.cnpj)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(cliente)}
                          className="flex items-center justify-center size-9 rounded-full text-[var(--text-tertiary)] hover:text-[#00AEEF] hover:bg-[rgba(0,174,239,0.1)] transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cliente)}
                          className="flex items-center justify-center size-9 rounded-full text-[var(--text-tertiary)] hover:text-[#FF3B30] hover:bg-[rgba(255,59,48,0.1)] transition-colors"
                          title="Excluir"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            delete
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          />
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCliente ? "Editar Cliente" : "Novo Cliente"}
        description="Preencha os dados do cliente"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Doc type selector + input */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[var(--text-primary)] text-[15px] font-medium">Documento</span>
              <div className="flex rounded-lg overflow-hidden border border-[var(--border-primary)] ml-auto">
                <button
                  type="button"
                  onClick={() => handleDocTypeChange("cpf")}
                  className={`px-3 py-1 text-[12px] font-semibold transition-colors ${
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
                  className={`px-3 py-1 text-[12px] font-semibold transition-colors ${
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
              placeholder={docType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
              value={formData.cnpj}
              onChange={handleDocChange}
              required
            />
            {cnpjLoading && (
              <div className="flex items-center gap-2 mt-2 text-[13px] text-[#00AEEF]">
                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                Buscando dados do CNPJ...
              </div>
            )}
            {cnpjStatus === "found" && !cnpjLoading && (
              <div className="flex items-center gap-2 mt-2 text-[13px] text-[#34C759]">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                CNPJ encontrado - dados preenchidos automaticamente
              </div>
            )}
            {cnpjStatus === "not_found" && !cnpjLoading && (
              <div className="flex items-center gap-2 mt-2 text-[13px] text-[#FF9500]">
                <span className="material-symbols-outlined text-[16px]">warning</span>
                CNPJ não encontrado na base da Receita Federal
              </div>
            )}
          </div>

          <Input
            label="Nome / Razão Social"
            placeholder="Ex: JC Solucoes Tecnologicas Ltda"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            required
          />

          <Input
            label="E-mail para Faturamento"
            type="email"
            placeholder="financeiro@empresa.com.br"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Nome do Responsável"
            placeholder="Ex: Joao Silva"
            value={formData.responsavel}
            onChange={(e) =>
              setFormData({ ...formData, responsavel: e.target.value })
            }
          />

          {formError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {formError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" loading={formLoading}>
              {editingCliente ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[var(--text-tertiary)] text-[15px]">
            Tem certeza que deseja excluir o cliente{" "}
            <strong className="text-[var(--text-primary)]">{deleteConfirm?.nome}</strong>?
          </p>
          <p className="text-[14px] text-[#FF9500] bg-[rgba(255,149,0,0.1)] p-4 rounded-xl border border-[rgba(255,149,0,0.2)] flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">
              warning
            </span>
            <span>Esta ação irá remover todos os recibos associados a este cliente.</span>
          </p>
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteConfirm(null)}
            >
              Cancelar
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>
              Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
