"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button, SearchableSelect, Drawer, CurrencyInput, Pagination } from "@/components/ui";
import { formatCurrency, formatMonthYear, getInitials, calculateTotal } from "@/lib/utils";
import type { Cliente, Recibo, PaginatedResponse, ApiResponse } from "@/types";

const MATERIAL_EXPEDIENTE = 5.0;

export default function RecibosPage() {
  const searchParams = useSearchParams();
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [drawerOpen, setDrawerOpen] = useState(searchParams.get("new") === "true");
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Recibo | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    clienteId: "",
    mesReferencia: new Date().toISOString().slice(0, 7),
    honorario: 0,
    decimoTerceiro: 0,
    registro: 0,
    alteracao: 0,
    outros: 0,
    detalhamento: "",
  });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const total = calculateTotal({
    honorario: formData.honorario,
    decimoTerceiro: formData.decimoTerceiro,
    registro: formData.registro,
    alteracao: formData.alteracao,
    materialExpediente: MATERIAL_EXPEDIENTE,
    outros: formData.outros,
  });

  const fetchRecibos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.append("search", search);

      const res = await fetch(`/api/recibos?${params}`);
      const data: ApiResponse<PaginatedResponse<Recibo>> = await res.json();

      if (data.success && data.data) {
        setRecibos(data.data.data);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Error fetching recibos:", error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  const fetchClientes = async () => {
    try {
      const res = await fetch("/api/clientes?limit=100");
      const data: ApiResponse<PaginatedResponse<Cliente>> = await res.json();

      if (data.success && data.data) {
        setClientes(data.data.data);
      }
    } catch (error) {
      console.error("Error fetching clientes:", error);
    }
  };

  useEffect(() => {
    fetchRecibos();
    fetchClientes();
  }, [fetchRecibos]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchRecibos();
  };

  const openNewDrawer = () => {
    setEditingRecibo(null);
    setFormData({
      clienteId: "",
      mesReferencia: new Date().toISOString().slice(0, 7),
      honorario: 0,
      decimoTerceiro: 0,
      registro: 0,
      alteracao: 0,
      outros: 0,
      detalhamento: "",
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const openEditDrawer = (recibo: Recibo) => {
    setEditingRecibo(recibo);
    const mesRef = new Date(recibo.mesReferencia);
    setFormData({
      clienteId: recibo.clienteId,
      mesReferencia: `${mesRef.getFullYear()}-${String(mesRef.getMonth() + 1).padStart(2, "0")}`,
      honorario: Number(recibo.honorario),
      decimoTerceiro: Number(recibo.decimoTerceiro),
      registro: Number(recibo.registro),
      alteracao: Number(recibo.alteracao),
      outros: Number(recibo.outros),
      detalhamento: recibo.detalhamento || "",
    });
    setFormError("");
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);

    try {
      const url = editingRecibo
        ? `/api/recibos/${editingRecibo.id}`
        : "/api/recibos";
      const method = editingRecibo ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data: ApiResponse = await res.json();

      if (!data.success) {
        setFormError(data.error || "Erro ao salvar recibo");
        return;
      }

      setDrawerOpen(false);
      fetchRecibos();
    } catch {
      setFormError("Erro ao conectar com o servidor");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      const res = await fetch(`/api/recibos/${deleteConfirm.id}`, {
        method: "DELETE",
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        setDeleteConfirm(null);
        fetchRecibos();
      }
    } catch (error) {
      console.error("Error deleting recibo:", error);
    }
  };

  const handleStatusChange = async (recibo: Recibo, newStatus: string) => {
    try {
      const res = await fetch(`/api/recibos/${recibo.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data: ApiResponse = await res.json();

      if (data.success) {
        fetchRecibos();
      }
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Page Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
            Recibos
          </h1>
          <p className="text-[var(--text-tertiary)] text-[15px]">
            Gerencie, edite e baixe os recibos fiscais emitidos
          </p>
        </div>
        <Button onClick={openNewDrawer} icon="add">
          Novo Recibo
        </Button>
      </div>

      {/* Filters & Search Toolbar */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[var(--surface-primary)] p-2 rounded-2xl border border-[var(--border-primary)] shadow-sm"
      >
        <div className="relative flex-1 min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[20px]">search</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[14px] transition-all outline-none"
            placeholder="Buscar por nome do cliente..."
          />
        </div>
        <Button type="submit" variant="secondary" size="sm">
          Buscar
        </Button>
      </form>

      {/* Table Container */}
      <div className="w-full bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                <th className="px-6 py-4 text-[var(--text-tertiary)] text-[12px] uppercase font-semibold tracking-wider w-[35%]">
                  Cliente
                </th>
                <th className="px-6 py-4 text-[var(--text-tertiary)] text-[12px] uppercase font-semibold tracking-wider w-[15%]">
                  Valor
                </th>
                <th className="px-6 py-4 text-[var(--text-tertiary)] text-[12px] uppercase font-semibold tracking-wider w-[15%]">
                  Referencia
                </th>
                <th className="px-6 py-4 text-[var(--text-tertiary)] text-[12px] uppercase font-semibold tracking-wider w-[15%]">
                  Status
                </th>
                <th className="px-6 py-4 text-[var(--text-tertiary)] text-[12px] uppercase font-semibold tracking-wider w-[20%] text-right">
                  Acoes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-secondary)]">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">
                      progress_activity
                    </span>
                  </td>
                </tr>
              ) : recibos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-[var(--text-quaternary)]">
                          inbox
                        </span>
                      </div>
                      <p className="text-[var(--text-tertiary)] text-[15px]">
                        Nenhum recibo encontrado
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                recibos.map((recibo) => (
                  <tr
                    key={recibo.id}
                    className="group hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-semibold text-[12px]">
                          {recibo.cliente
                            ? getInitials(recibo.cliente.nome)
                            : "??"}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[var(--text-primary)] font-medium text-[14px]">
                            {recibo.cliente?.nome || "Cliente removido"}
                          </span>
                          <span className="text-[var(--text-tertiary)] text-[12px]">
                            #{recibo.id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[var(--text-primary)] font-semibold text-[14px]">
                        {formatCurrency(Number(recibo.total))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[var(--text-secondary)] text-[14px]">
                        {formatMonthYear(recibo.mesReferencia)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={recibo.status}
                        onChange={(e) => handleStatusChange(recibo, e.target.value)}
                        className={`px-3 py-1 rounded-full text-[12px] font-semibold border bg-transparent cursor-pointer transition-colors ${
                          recibo.status === "pago"
                            ? "text-[#34C759] border-[rgba(52,199,89,0.3)] bg-[rgba(52,199,89,0.1)]"
                            : recibo.status === "cancelado"
                            ? "text-[#FF3B30] border-[rgba(255,59,48,0.3)] bg-[rgba(255,59,48,0.1)]"
                            : "text-[#FF9500] border-[rgba(255,149,0,0.3)] bg-[rgba(255,149,0,0.1)]"
                        }`}
                      >
                        <option value="pendente">Pendente</option>
                        <option value="pago">Pago</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditDrawer(recibo)}
                          className="size-9 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#00AEEF] hover:bg-[rgba(0,174,239,0.1)] transition-colors"
                          title="Editar"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                        <a
                          href={`/api/recibos/${recibo.id}/pdf`}
                          download
                          className="size-9 rounded-full flex items-center justify-center text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white transition-all"
                          title="Download PDF"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            download
                          </span>
                        </a>
                        <button
                          onClick={() => setDeleteConfirm(recibo)}
                          className="size-9 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#FF3B30] hover:bg-[rgba(255,59,48,0.1)] transition-colors"
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

      {/* Create/Edit Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editingRecibo ? "Editar Recibo" : "Emitir Novo Recibo"}
        description="Preencha os detalhes financeiros para gerar o documento."
        footer={
          <div className="flex gap-4">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDrawerOpen(false)}
            >
              Cancelar
            </Button>
            <Button className="flex-1" loading={formLoading} onClick={handleSubmit}>
              Salvar Recibo
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <SearchableSelect
                label="Cliente"
                placeholder="Selecione o cliente..."
                searchPlaceholder="Buscar cliente por nome ou CNPJ..."
                options={clientes.map((c) => ({
                  value: c.id,
                  label: c.nome,
                  sublabel: c.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")
                }))}
                value={formData.clienteId}
                onChange={(value) =>
                  setFormData({ ...formData, clienteId: value })
                }
                required
              />
            </div>
            <div>
              <label className="flex flex-col gap-2">
                <span className="text-[var(--text-primary)] text-[15px] font-medium">Mes de Referencia</span>
                <input
                  type="month"
                  value={formData.mesReferencia}
                  onChange={(e) =>
                    setFormData({ ...formData, mesReferencia: e.target.value })
                  }
                  className="flex w-full rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] border border-[var(--border-primary)] bg-[var(--surface-primary)] focus:border-[#00AEEF] h-[52px] px-4 text-[16px] font-normal transition-all"
                  required
                />
              </label>
            </div>
          </div>

          <div className="h-px w-full bg-[var(--border-primary)] my-2"></div>

          <div>
            <h3 className="text-[var(--text-primary)] text-[18px] font-semibold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00AEEF] text-[22px]">payments</span>
              Valores
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <CurrencyInput
                label="Honorarios"
                value={formData.honorario}
                onChange={(value) => setFormData({ ...formData, honorario: value })}
                required
              />
              <CurrencyInput
                label="13o Salario"
                value={formData.decimoTerceiro}
                onChange={(value) =>
                  setFormData({ ...formData, decimoTerceiro: value })
                }
              />
              <CurrencyInput
                label="Taxa de Registro"
                value={formData.registro}
                onChange={(value) => setFormData({ ...formData, registro: value })}
              />
              <CurrencyInput
                label="Alteracao Contratual"
                value={formData.alteracao}
                onChange={(value) => setFormData({ ...formData, alteracao: value })}
              />
              <CurrencyInput
                label="Material Expediente"
                value={MATERIAL_EXPEDIENTE}
                disabled
              />
              <CurrencyInput
                label="Outros"
                value={formData.outros}
                onChange={(value) => setFormData({ ...formData, outros: value })}
              />
            </div>
          </div>

          <div>
            <label className="flex flex-col gap-2">
              <span className="text-[var(--text-primary)] text-[15px] font-medium">
                Detalhamento (Opcional)
              </span>
              <textarea
                value={formData.detalhamento}
                onChange={(e) =>
                  setFormData({ ...formData, detalhamento: e.target.value })
                }
                className="flex w-full rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] border border-[var(--border-primary)] bg-[var(--surface-primary)] focus:border-[#00AEEF] min-h-[100px] p-4 text-[16px] font-normal transition-all resize-none"
                placeholder="Adicione observacoes sobre os valores cobrados..."
              />
            </label>
          </div>

          {/* Total */}
          <div className="bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.2)] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 mt-4">
            <span className="text-[var(--text-tertiary)] text-[13px] uppercase tracking-wide font-semibold">
              Valor Total a Receber
            </span>
            <div className="text-[36px] font-bold text-[#00AEEF] flex items-baseline gap-1">
              <span className="text-[24px] font-medium opacity-80">R$</span>
              {total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {formError}
            </div>
          )}
        </form>
      </Drawer>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative w-full max-w-md bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl shadow-2xl p-6 animate-fadeIn">
            <h3 className="text-[var(--text-primary)] text-[20px] font-bold mb-2">Confirmar Exclusao</h3>
            <p className="text-[var(--text-tertiary)] text-[15px] mb-5">
              Tem certeza que deseja excluir este recibo?
            </p>
            <div className="flex gap-3">
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
        </div>
      )}
    </div>
  );
}
