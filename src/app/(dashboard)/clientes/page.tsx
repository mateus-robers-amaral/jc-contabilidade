"use client";

import { useState, useEffect, useCallback } from "react";
import { Button, Modal, Pagination } from "@/components/ui";
import { getInitials, formatCurrency } from "@/lib/utils";
import ClienteWizard from "@/components/clientes/ClienteWizard";
import type { ClienteWithStats, PaginatedResponse, ApiResponse } from "@/types";

function formatDoc(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Mais recentes" },
  { value: "createdAt-asc", label: "Mais antigos" },
  { value: "nome-asc", label: "Nome (A-Z)" },
  { value: "nome-desc", label: "Nome (Z-A)" },
  { value: "totalRecibos-desc", label: "Maior faturamento" },
  { value: "totalRecibos-asc", label: "Menor faturamento" },
  { value: "recibosCount-desc", label: "Mais recibos" },
];

const STATUS_OPTIONS = [
  { value: "todos", label: "Todas" },
  { value: "ativos", label: "Ativas" },
  { value: "inativos", label: "Inativas" },
];

export default function ClientesPage() {
  const [clientes, setClientes] = useState<ClienteWithStats[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortValue, setSortValue] = useState("nome-asc");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteWithStats | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ClienteWithStats | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const [sortBy, sortOrder] = sortValue.split("-");
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
        status: statusFilter,
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/clientes?${params}`);
      const data: ApiResponse<PaginatedResponse<ClienteWithStats>> = await res.json();

      if (data.success && data.data) {
        setClientes(data.data.data);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sortValue, statusFilter]);

  useEffect(() => {
    fetchClientes();
  }, [fetchClientes]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchClientes();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/clientes/${deleteConfirm.id}`, { method: "DELETE" });
      const data: ApiResponse = await res.json();
      if (data.success) {
        setDeleteConfirm(null);
        fetchClientes();
      }
    } catch (error) {
      console.error("Error deleting cliente:", error);
    }
  };

  const handleToggleAtivo = async (cliente: ClienteWithStats) => {
    setTogglingId(cliente.id);
    try {
      const res = await fetch(`/api/clientes/${cliente.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !cliente.ativo }),
      });
      const data: ApiResponse = await res.json();
      if (data.success) fetchClientes();
    } catch (error) {
      console.error("Error toggling cliente:", error);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">Clientes</h1>
          <p className="text-[var(--text-tertiary)] text-[15px]">Gerencie sua base de clientes e emita recibos</p>
        </div>
        <Button onClick={() => { setEditingCliente(null); setWizardOpen(true); }} icon="add">
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
        <div className="relative flex items-center h-12 min-w-[160px] rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus-within:border-[#00AEEF] focus-within:ring-4 focus-within:ring-[rgba(0,174,239,0.15)] transition-all">
          <div className="absolute left-4 text-[var(--text-tertiary)] flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">filter_alt</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="w-full h-full bg-transparent pl-11 pr-4 rounded-xl text-[var(--text-primary)] focus:outline-none text-[14px] font-normal appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-3 text-[var(--text-tertiary)] pointer-events-none">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>
        <div className="relative flex items-center h-12 min-w-[200px] rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus-within:border-[#00AEEF] focus-within:ring-4 focus-within:ring-[rgba(0,174,239,0.15)] transition-all">
          <div className="absolute left-4 text-[var(--text-tertiary)] flex items-center justify-center pointer-events-none">
            <span className="material-symbols-outlined text-[20px]">sort</span>
          </div>
          <select
            value={sortValue}
            onChange={(e) => { setSortValue(e.target.value); setPagination((prev) => ({ ...prev, page: 1 })); }}
            className="w-full h-full bg-transparent pl-11 pr-4 rounded-xl text-[var(--text-primary)] focus:outline-none text-[14px] font-normal appearance-none cursor-pointer"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <div className="absolute right-3 text-[var(--text-tertiary)] pointer-events-none">
            <span className="material-symbols-outlined text-[18px]">expand_more</span>
          </div>
        </div>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {/* Table */}
      <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-[30%]">Empresa</th>
                <th className="px-6 py-4 text-left text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-[25%]">CPF/CNPJ</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-[25%]">Faturamento</th>
                <th className="px-6 py-4 text-right text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] w-[20%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-secondary)]">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">progress_activity</span>
                  </td>
                </tr>
              ) : clientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-[var(--text-quaternary)]">inbox</span>
                      </div>
                      <p className="text-[var(--text-tertiary)] text-[15px]">Nenhum cliente encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="group hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center size-10 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-bold text-[13px] shrink-0 shadow-sm">
                          {getInitials(cliente.nome)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <div className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{cliente.nome}</div>
                            <span
                              className={`inline-flex shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                cliente.ativo
                                  ? "bg-[rgba(52,199,89,0.12)] text-[#34C759]"
                                  : "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]"
                              }`}
                            >
                              {cliente.ativo ? "Ativa" : "Inativa"}
                            </span>
                          </div>
                          <div className="text-[12px] text-[var(--text-tertiary)]">
                            Cadastrado em {new Date(cliente.createdAt).toLocaleDateString("pt-BR")}
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
                      <div className="flex flex-col items-end">
                        <span className="text-[14px] font-semibold text-[var(--text-primary)]">{formatCurrency(cliente.totalFaturamento ?? 0)}</span>
                        <span className="text-[12px] text-[var(--text-tertiary)]">
                          {cliente.recibosCount ?? 0} {(cliente.recibosCount ?? 0) === 1 ? "recibo" : "recibos"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleAtivo(cliente)}
                          disabled={togglingId === cliente.id}
                          className={`flex items-center justify-center size-9 rounded-full transition-colors disabled:opacity-50 ${
                            cliente.ativo
                              ? "text-[#34C759] hover:bg-[rgba(52,199,89,0.1)]"
                              : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                          title={cliente.ativo ? "Desativar empresa" : "Ativar empresa"}
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {togglingId === cliente.id
                              ? "progress_activity"
                              : cliente.ativo
                              ? "toggle_on"
                              : "toggle_off"}
                          </span>
                        </button>
                        <button
                          onClick={() => { setEditingCliente(cliente); setWizardOpen(true); }}
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
                          <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

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

      {/* Client Wizard */}
      <ClienteWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={fetchClientes}
        editingCliente={editingCliente}
      />

      {/* Delete Confirmation */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirmar Exclusão" size="sm">
        <div className="space-y-4">
          <p className="text-[var(--text-tertiary)] text-[15px]">
            Tem certeza que deseja excluir o cliente{" "}
            <strong className="text-[var(--text-primary)]">{deleteConfirm?.nome}</strong>?
          </p>
          <p className="text-[14px] text-[#FF9500] bg-[rgba(255,149,0,0.1)] p-4 rounded-xl border border-[rgba(255,149,0,0.2)] flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] mt-0.5">warning</span>
            <span>Esta ação irá remover todos os recibos associados a este cliente.</span>
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
