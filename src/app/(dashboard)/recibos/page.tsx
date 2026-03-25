"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Modal } from "@/components/ui";
import { formatCurrency, getInitials } from "@/lib/utils";
import ReciboWizard from "@/components/recibos/ReciboWizard";
import ReciboPreviewModal from "@/components/recibos/ReciboPreviewModal";
import type { Cliente, Recibo, PaginatedResponse, ApiResponse } from "@/types";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function mesAnoKey(date: Date | string): string {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function mesAnoLabel(key: string): string {
  const [year, month] = key.split("-");
  return `${MESES[parseInt(month) - 1]} ${year}`;
}

function getReciboNome(r: Recibo): string {
  return r.cliente?.nome || r.avulsoNome || "Cliente removido";
}

function isAvulso(r: Recibo): boolean {
  return !r.clienteId;
}

interface MonthGroup {
  key: string;
  label: string;
  recibos: Recibo[];
  total: number;
  pagos: number;
  pendentes: number;
  cancelados: number;
}

export default function RecibosPage() {
  const searchParams = useSearchParams();
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(searchParams.get("new") === "true");
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null);
  const [previewRecibo, setPreviewRecibo] = useState<Recibo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Recibo | null>(null);

  // Email state
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<Recibo | null>(null);
  const [emailAssunto, setEmailAssunto] = useState("");
  const [emailMensagem, setEmailMensagem] = useState("");

  // Lote (bulk) state
  const [loteOpen, setLoteOpen] = useState(false);
  const [loteMes, setLoteMes] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loteLoading, setLoteLoading] = useState(false);
  const [loteResult, setLoteResult] = useState<{ success: boolean; message: string } | null>(null);

  // Relatório state
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [availableData, setAvailableData] = useState<{ ano: number; mes: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [relatorioLoading, setRelatorioLoading] = useState(false);
  const [relatorioError, setRelatorioError] = useState("");
  const [relatorioPdfUrl, setRelatorioPdfUrl] = useState<string | null>(null);
  const [relatorioPdfLabel, setRelatorioPdfLabel] = useState("");
  const [relatorioFullscreen, setRelatorioFullscreen] = useState(false);
  const [emailError, setEmailError] = useState("");

  const fetchRecibos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/recibos?limit=500");
      const data: ApiResponse<PaginatedResponse<Recibo>> = await res.json();

      if (data.success && data.data) {
        setRecibos(data.data.data);
      }
    } catch (error) {
      console.error("Error fetching recibos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

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

  // Fetch available months when relatório modal opens
  useEffect(() => {
    if (!relatorioOpen) return;
    fetch("/api/relatorios/meses-disponiveis")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setAvailableData(res.data);
      })
      .catch(console.error);
  }, [relatorioOpen]);

  const availableYears = [...new Set(availableData.map((d) => d.ano))].sort((a, b) => b - a);
  const availableMonthsList = selectedYear
    ? availableData.filter((d) => d.ano === selectedYear).map((d) => d.mes).sort((a, b) => b - a)
    : [];

  const openRelatorioModal = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setRelatorioError("");
    setRelatorioOpen(true);
  };

  const handleViewRelatorio = () => {
    if (!selectedYear || !selectedMonth) return;
    const mesParam = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
    setRelatorioPdfUrl(`/api/relatorios/mensal?mes=${mesParam}`);
    setRelatorioPdfLabel(`${MESES[selectedMonth - 1]} ${selectedYear}`);
    setRelatorioOpen(false);
  };

  const handleDownloadRelatorio = () => {
    if (!relatorioPdfUrl) return;
    const a = document.createElement("a");
    a.href = relatorioPdfUrl;
    a.download = `relatorio_${relatorioPdfLabel.replace(" ", "_").toLowerCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const closeRelatorioPdf = () => {
    setRelatorioPdfUrl(null);
    setRelatorioFullscreen(false);
  };

  // Month modal state
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);
  const [openMonthGroup, setOpenMonthGroup] = useState<MonthGroup | null>(null);
  const [modalSearch, setModalSearch] = useState("");
  const [modalStatusFilter, setModalStatusFilter] = useState<string>("todos");

  // Group recibos by month
  const monthGroups: MonthGroup[] = useMemo(() => {
    const groups: Record<string, Recibo[]> = {};
    for (const recibo of recibos) {
      const key = mesAnoKey(recibo.mesReferencia);
      if (!groups[key]) groups[key] = [];
      groups[key].push(recibo);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        key,
        label: mesAnoLabel(key),
        recibos: items,
        total: items.reduce((sum, r) => sum + Number(r.total), 0),
        pagos: items.filter((r) => r.status === "pago").length,
        pendentes: items.filter((r) => r.status === "pendente").length,
        cancelados: items.filter((r) => r.status === "cancelado").length,
      }));
  }, [recibos]);

  // Sync open modal with updated recibos data
  useEffect(() => {
    if (openMonthGroup) {
      const updated = monthGroups.find((g) => g.key === openMonthGroup.key);
      if (updated) setOpenMonthGroup(updated);
    }
  }, [monthGroups]);

  // Stats based on selected month or all
  const stats = useMemo(() => {
    const selectedGroup = selectedMonthKey
      ? monthGroups.find((g) => g.key === selectedMonthKey)
      : null;
    const source = selectedGroup ? selectedGroup.recibos : recibos;
    const pagos = source.filter((r) => r.status === "pago");
    const pendentes = source.filter((r) => r.status === "pendente");
    return {
      totalRecibos: source.length,
      totalGeral: source.reduce((sum, r) => sum + Number(r.total), 0),
      pagosCount: pagos.length,
      pagosTotal: pagos.reduce((sum, r) => sum + Number(r.total), 0),
      pendentesCount: pendentes.length,
      pendentesTotal: pendentes.reduce((sum, r) => sum + Number(r.total), 0),
      label: selectedGroup ? selectedGroup.label : "Todos os meses",
    };
  }, [recibos, monthGroups, selectedMonthKey]);

  const openMonth = (group: MonthGroup) => {
    setSelectedMonthKey(group.key);
    setOpenMonthGroup(group);
    setModalSearch("");
    setModalStatusFilter("todos");
  };

  const closeMonthModal = () => {
    setOpenMonthGroup(null);
  };

  // Sort state for table columns
  const [sortColumn, setSortColumn] = useState<"cliente" | "valor" | "status" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const handleSort = (col: "cliente" | "valor" | "status") => {
    if (sortColumn === col) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(col);
      setSortDir("asc");
    }
  };
  const sortRecibos = useCallback((items: Recibo[]) => {
    if (!sortColumn) return items;
    const sorted = [...items].sort((a, b) => {
      if (sortColumn === "cliente") {
        return getReciboNome(a).localeCompare(getReciboNome(b), "pt-BR");
      }
      if (sortColumn === "valor") {
        return Number(a.total) - Number(b.total);
      }
      const order: Record<string, number> = { pendente: 0, pago: 1, cancelado: 2 };
      return (order[a.status] ?? 0) - (order[b.status] ?? 0);
    });
    return sortDir === "desc" ? sorted.reverse() : sorted;
  }, [sortColumn, sortDir]);

  // Filtered recibos inside the month modal
  const modalRecibos = useMemo(() => {
    if (!openMonthGroup) return [];
    let items = openMonthGroup.recibos;
    if (modalSearch) {
      const q = modalSearch.toLowerCase();
      items = items.filter((r) => getReciboNome(r).toLowerCase().includes(q));
    }
    if (modalStatusFilter !== "todos") {
      items = items.filter((r) => r.status === modalStatusFilter);
    }
    return sortRecibos(items);
  }, [openMonthGroup, modalSearch, modalStatusFilter, sortRecibos]);

  const handleLoteSubmit = async () => {
    setLoteLoading(true);
    setLoteResult(null);
    try {
      const res = await fetch("/api/recibos/lote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mesReferencia: loteMes }),
      });
      const data: ApiResponse = await res.json();
      if (data.success) {
        setLoteResult({ success: true, message: data.message || "Recibos criados com sucesso" });
        fetchRecibos();
      } else {
        setLoteResult({ success: false, message: data.error || "Erro ao criar recibos" });
      }
    } catch {
      setLoteResult({ success: false, message: "Erro ao conectar com o servidor" });
    } finally {
      setLoteLoading(false);
    }
  };

  const openNewWizard = () => {
    setEditingRecibo(null);
    setWizardOpen(true);
  };

  const openEditWizard = (recibo: Recibo) => {
    setEditingRecibo(recibo);
    setWizardOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`/api/recibos/${deleteConfirm.id}`, { method: "DELETE" });
      const data: ApiResponse = await res.json();
      if (data.success) { setDeleteConfirm(null); fetchRecibos(); }
    } catch (error) { console.error("Error deleting recibo:", error); }
  };

  const handleStatusChange = async (recibo: Recibo, newStatus: string) => {
    // Optimistic update — no reload
    setRecibos((prev) =>
      prev.map((r) =>
        r.id === recibo.id
          ? { ...r, status: newStatus as Recibo["status"], dataPagamento: newStatus === "pago" ? new Date().toISOString() as unknown as Date : null }
          : r
      )
    );
    try {
      const res = await fetch(`/api/recibos/${recibo.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      const data: ApiResponse<Recibo> = await res.json();
      if (!data.success) {
        // Revert on failure
        setRecibos((prev) => prev.map((r) => (r.id === recibo.id ? recibo : r)));
      }
    } catch {
      // Revert on error
      setRecibos((prev) => prev.map((r) => (r.id === recibo.id ? recibo : r)));
    }
  };

  const openEmailModal = (recibo: Recibo) => {
    if (!recibo.cliente?.email) { alert("Cliente não possui e-mail cadastrado"); return; }
    const mesRef = new Date(recibo.mesReferencia);
    const mesAno = `${MESES[mesRef.getUTCMonth()]}/${mesRef.getUTCFullYear()}`;
    const valor = formatCurrency(Number(recibo.total));
    setEmailAssunto(`Recibo de Honorários - ${mesAno} | J AMARAL CONTABIL`);
    setEmailMensagem(`Segue em anexo o recibo de honorários contábeis referente a ${mesAno}, no valor de ${valor}.`);
    setEmailError("");
    setEmailModal(recibo);
  };

  const handleSendEmail = async () => {
    if (!emailModal || sendingEmail) return;
    const reciboId = emailModal.id;
    setSendingEmail(reciboId);
    setEmailError("");
    try {
      const res = await fetch(`/api/recibos/${reciboId}/email`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assunto: emailAssunto, mensagem: emailMensagem }),
      });
      const data: ApiResponse = await res.json();
      if (data.success) {
        setEmailModal(null);
        fetchRecibos();
      } else { setEmailError(data.error || "Erro ao enviar e-mail"); }
    } catch { setEmailError("Erro ao conectar com o servidor"); }
    finally { setSendingEmail(null); }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">Recibos</h1>
          <p className="text-[var(--text-tertiary)] text-[15px]">Gerencie, edite e baixe os recibos fiscais emitidos</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={openRelatorioModal}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-[15px] font-medium bg-[var(--surface-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Relatório</span>
          </button>
          <Button onClick={() => { setLoteResult(null); setLoteOpen(true); }} icon="group" variant="secondary">Emitir para Todos</Button>
          <Button onClick={openNewWizard} icon="add">Novo Recibo</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="flex flex-col gap-2">
        {selectedMonthKey && (
          <div className="flex items-center gap-2">
            <span className="text-[var(--text-tertiary)] text-[13px]">Exibindo KPIs de <strong className="text-[var(--text-primary)]">{stats.label}</strong></span>
            <button onClick={() => setSelectedMonthKey(null)} className="text-[#00AEEF] text-[13px] font-medium hover:underline cursor-pointer">Ver total</button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(0,174,239,0.1)] mb-3">
              <span className="material-symbols-outlined text-[#00AEEF] text-[22px]">receipt_long</span>
            </div>
            <p className="text-[var(--text-tertiary)] text-[12px] font-medium uppercase tracking-wide">Total de Recibos</p>
            <p className="text-[var(--text-primary)] text-[24px] font-bold">{stats.totalRecibos}</p>
          </div>
          <div className="flex flex-col p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(88,86,214,0.1)] mb-3">
              <span className="material-symbols-outlined text-[#5856D6] text-[22px]">payments</span>
            </div>
            <p className="text-[var(--text-tertiary)] text-[12px] font-medium uppercase tracking-wide">Faturamento Total</p>
            <p className="text-[var(--text-primary)] text-[24px] font-bold">{formatCurrency(stats.totalGeral)}</p>
          </div>
          <div className="flex flex-col p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(52,199,89,0.1)] mb-3">
              <span className="material-symbols-outlined text-[#34C759] text-[22px]">check_circle</span>
            </div>
            <p className="text-[var(--text-tertiary)] text-[12px] font-medium uppercase tracking-wide">Pagos</p>
            <p className="text-[var(--text-primary)] text-[24px] font-bold">{stats.pagosCount}</p>
            <p className="text-[var(--text-tertiary)] text-[12px] mt-1">{formatCurrency(stats.pagosTotal)}</p>
          </div>
          <div className="flex flex-col p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm">
            <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(255,149,0,0.1)] mb-3">
              <span className="material-symbols-outlined text-[#FF9500] text-[22px]">schedule</span>
            </div>
            <p className="text-[var(--text-tertiary)] text-[12px] font-medium uppercase tracking-wide">Pendentes</p>
            <p className="text-[var(--text-primary)] text-[24px] font-bold">{stats.pendentesCount}</p>
            <p className="text-[var(--text-tertiary)] text-[12px] mt-1">{formatCurrency(stats.pendentesTotal)}</p>
          </div>
        </div>
      </div>

      {/* Month Cards */}
      {loading ? (
        <div className="flex justify-center py-16">
          <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">progress_activity</span>
        </div>
      ) : recibos.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16">
          <div className="size-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px] text-[var(--text-quaternary)]">inbox</span>
          </div>
          <p className="text-[var(--text-tertiary)] text-[15px]">Nenhum recibo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthGroups.map((group) => {
            const isSelected = selectedMonthKey === group.key;
            const mesNum = parseInt(group.key.split("-")[1]);
            return (
              <button
                key={group.key}
                onClick={() => openMonth(group)}
                className={`flex flex-col p-5 rounded-2xl border text-left transition-all cursor-pointer hover:shadow-md ${
                  isSelected
                    ? "border-[#00AEEF] bg-[rgba(0,174,239,0.05)] ring-2 ring-[rgba(0,174,239,0.15)]"
                    : "border-[var(--border-primary)] bg-[var(--surface-primary)] hover:border-[#00AEEF]"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-[#2E3192]">
                    <span className="text-white text-[13px] font-bold">{MESES[mesNum - 1]?.substring(0, 3).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-[var(--text-primary)] text-[15px] font-bold leading-tight">{MESES[mesNum - 1]}</p>
                    <p className="text-[var(--text-tertiary)] text-[11px]">{group.key.split("-")[0]}</p>
                  </div>
                </div>
                <p className="text-[#00AEEF] text-[18px] font-bold mb-2">{formatCurrency(group.total)}</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#34C759]">
                    <span className="size-1.5 rounded-full bg-[#34C759]" />{group.pagos}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF9500]">
                    <span className="size-1.5 rounded-full bg-[#FF9500]" />{group.pendentes}
                  </span>
                  {group.cancelados > 0 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF3B30]">
                      <span className="size-1.5 rounded-full bg-[#FF3B30]" />{group.cancelados}
                    </span>
                  )}
                  <span className="text-[var(--text-tertiary)] text-[11px] ml-auto">{group.recibos.length} recibo{group.recibos.length !== 1 ? "s" : ""}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Month Detail Modal */}
      {openMonthGroup && (
        <div className="fixed inset-0 z-50 flex flex-col p-3 md:p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeMonthModal} />
          <div className="relative flex flex-col w-full h-full max-w-5xl mx-auto z-10 bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)] shrink-0">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center size-10 rounded-xl bg-[#2E3192]">
                  <span className="material-symbols-outlined text-white text-[20px]">calendar_month</span>
                </div>
                <div>
                  <h2 className="text-[var(--text-primary)] text-[18px] font-bold">{openMonthGroup.label}</h2>
                  <p className="text-[var(--text-tertiary)] text-[12px]">{openMonthGroup.recibos.length} recibo{openMonthGroup.recibos.length !== 1 ? "s" : ""} — {formatCurrency(openMonthGroup.total)}</p>
                </div>
              </div>
              <button onClick={closeMonthModal}
                className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 px-6 py-3 border-b border-[var(--border-primary)] shrink-0">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[18px]">search</span>
                </div>
                <input
                  type="text"
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[13px] transition-all outline-none"
                  placeholder="Buscar cliente..."
                />
              </div>
              <div className="flex items-center gap-2">
                {(["todos", "pendente", "pago", "cancelado"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setModalStatusFilter(st)}
                    className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer ${
                      modalStatusFilter === st
                        ? st === "pago" ? "bg-[#34C759] text-white"
                          : st === "pendente" ? "bg-[#FF9500] text-white"
                          : st === "cancelado" ? "bg-[#FF3B30] text-white"
                          : "bg-[#00AEEF] text-white"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    {st === "todos" ? "Todos" : st === "pago" ? "Pagos" : st === "pendente" ? "Pendentes" : "Cancelados"}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                    {(["cliente", "valor", "status"] as const).map((col) => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="px-6 py-3 text-[var(--text-tertiary)] text-[11px] uppercase font-semibold tracking-wider cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none"
                      >
                        <span className="inline-flex items-center gap-1">
                          {col === "cliente" ? "Cliente" : col === "valor" ? "Valor" : "Status"}
                          {sortColumn === col && (
                            <span className="material-symbols-outlined text-[14px] text-[#00AEEF]">
                              {sortDir === "asc" ? "arrow_upward" : "arrow_downward"}
                            </span>
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="px-6 py-3 text-[var(--text-tertiary)] text-[11px] uppercase font-semibold tracking-wider text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-secondary)]">
                  {modalRecibos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-tertiary)] text-[14px]">
                        Nenhum recibo encontrado com esses filtros
                      </td>
                    </tr>
                  ) : modalRecibos.map((recibo) => (
                    <tr key={recibo.id} onClick={() => setPreviewRecibo(recibo)} className="group hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center size-10 rounded-xl text-white font-bold text-[12px] ${
                            isAvulso(recibo) ? "bg-gradient-to-br from-[#FF9500] to-[#FF6B00]" : "bg-gradient-to-br from-[#00AEEF] to-[#2E3192]"
                          }`}>
                            {getInitials(getReciboNome(recibo))}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--text-primary)] font-medium text-[13px]">
                              {getReciboNome(recibo)}
                            </span>
                            {isAvulso(recibo) && (
                              <span className="px-1.5 py-0.5 rounded bg-[rgba(255,149,0,0.15)] text-[#FF9500] text-[9px] font-bold uppercase">Avulso</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[var(--text-primary)] font-semibold text-[13px]">
                          {formatCurrency(Number(recibo.total))}
                        </span>
                      </td>
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={recibo.status}
                          onChange={(e) => handleStatusChange(recibo, e.target.value)}
                          className={`px-3 py-1 rounded-full text-[11px] font-semibold border bg-transparent cursor-pointer transition-colors ${
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
                      <td className="px-6 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditWizard(recibo)} className="size-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#00AEEF] hover:bg-[rgba(0,174,239,0.1)] transition-colors" title="Editar">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <a href={`/api/recibos/${recibo.id}/pdf`} download className="size-8 rounded-full flex items-center justify-center text-[#00AEEF] hover:bg-[#00AEEF] hover:text-white transition-all" title="Download PDF">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </a>
                          {recibo.emailEnviadoEm ? (
                            <>
                              <span className="size-8 rounded-full flex items-center justify-center text-[#34C759] bg-[rgba(52,199,89,0.1)]" title={`Enviado em ${new Date(recibo.emailEnviadoEm).toLocaleDateString("pt-BR")}`}>
                                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                              </span>
                              <button onClick={() => openEmailModal(recibo)} disabled={!!sendingEmail}
                                className="size-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#5856D6] hover:bg-[rgba(88,86,214,0.1)] transition-all disabled:opacity-50"
                                title="Reenviar e-mail">
                                <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                              </button>
                            </>
                          ) : (
                            <button onClick={() => openEmailModal(recibo)} disabled={!!sendingEmail}
                              className="size-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#5856D6] hover:bg-[rgba(88,86,214,0.1)] transition-all disabled:opacity-50"
                              title={recibo.cliente?.email ? `Enviar para ${recibo.cliente.email}` : "Cliente sem e-mail"}>
                              <span className="material-symbols-outlined text-[18px]">mail</span>
                            </button>
                          )}
                          <button onClick={() => setDeleteConfirm(recibo)} className="size-8 rounded-full flex items-center justify-center text-[var(--text-tertiary)] hover:text-[#FF3B30] hover:bg-[rgba(255,59,48,0.1)] transition-colors" title="Excluir">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Wizard */}
      <ReciboWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={fetchRecibos}
        clientes={clientes}
        editingRecibo={editingRecibo}
      />

      {/* Preview Modal */}
      <ReciboPreviewModal
        isOpen={!!previewRecibo}
        onClose={() => setPreviewRecibo(null)}
        recibo={previewRecibo}
        onEdit={(r) => { setPreviewRecibo(null); openEditWizard(r); }}
        onSendEmail={(r) => { setPreviewRecibo(null); openEmailModal(r); }}
      />

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative w-full max-w-md bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-3xl shadow-2xl p-6 animate-fadeIn">
            <h3 className="text-[var(--text-primary)] text-[20px] font-bold mb-2">Confirmar Exclusão</h3>
            <p className="text-[var(--text-tertiary)] text-[15px] mb-5">Tem certeza que deseja excluir este recibo?</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
              <Button variant="danger" className="flex-1" onClick={handleDelete}>Excluir</Button>
            </div>
          </div>
        </div>
      )}

      {/* Email Modal */}
      <Modal isOpen={!!emailModal} onClose={() => { if (!sendingEmail) setEmailModal(null); }}
        title="Enviar Recibo por E-mail" description={emailModal?.cliente?.email ? `Para: ${emailModal.cliente.email}` : ""}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-[15px] font-medium">Assunto</label>
            <input type="text" value={emailAssunto} onChange={(e) => setEmailAssunto(e.target.value)} disabled={!!sendingEmail}
              className="w-full rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] border border-[var(--border-primary)] bg-[var(--surface-primary)] focus:border-[#00AEEF] h-[48px] px-4 text-[14px] transition-all disabled:opacity-50" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[var(--text-primary)] text-[15px] font-medium">Mensagem</label>
            <textarea value={emailMensagem} onChange={(e) => setEmailMensagem(e.target.value)} disabled={!!sendingEmail} rows={5}
              className="w-full rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] border border-[var(--border-primary)] bg-[var(--surface-primary)] focus:border-[#00AEEF] p-4 text-[14px] transition-all resize-none disabled:opacity-50" />
            <p className="text-[var(--text-tertiary)] text-[12px]">O PDF do recibo será anexado automaticamente ao e-mail.</p>
          </div>
          {emailError && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>{emailError}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" disabled={!!sendingEmail} onClick={() => setEmailModal(null)}>Cancelar</Button>
            <Button type="button" className="flex-1" disabled={!!sendingEmail} loading={!!sendingEmail} icon={sendingEmail ? undefined : "send"} onClick={handleSendEmail}>
              {sendingEmail ? "Enviando..." : "Enviar E-mail"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Create Modal */}
      <Modal
        isOpen={loteOpen}
        onClose={() => setLoteOpen(false)}
        title="Emitir Recibos para Todos"
        description="Cria recibos para todos os clientes que possuem honorário padrão cadastrado"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-primary)] text-[15px] font-medium mb-2">
              Mês de referência
            </label>
            <input
              type="month"
              value={loteMes}
              onChange={(e) => setLoteMes(e.target.value)}
              className="w-full h-[52px] bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-xl px-4 text-[var(--text-primary)] text-[15px] font-medium focus:outline-none focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] transition-all"
            />
          </div>

          <div className="flex items-start gap-3 p-4 rounded-xl bg-[rgba(0,174,239,0.08)] border border-[rgba(0,174,239,0.15)] text-[14px] text-[var(--text-secondary)]">
            <span className="material-symbols-outlined text-[#00AEEF] text-[20px] mt-0.5">info</span>
            <span>Apenas clientes com <strong>honorário padrão</strong> cadastrado serão incluídos. Clientes que já possuem recibo no mês selecionado serão ignorados.</span>
          </div>

          {loteResult && (
            <div className={`flex items-center gap-3 p-4 rounded-xl text-[14px] ${
              loteResult.success
                ? "bg-[rgba(52,199,89,0.1)] border border-[rgba(52,199,89,0.2)] text-[#34C759]"
                : "bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30]"
            }`}>
              <span className="material-symbols-outlined text-[20px]">
                {loteResult.success ? "check_circle" : "error"}
              </span>
              {loteResult.message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setLoteOpen(false)}>
              {loteResult?.success ? "Fechar" : "Cancelar"}
            </Button>
            {!loteResult?.success && (
              <Button className="flex-1" onClick={handleLoteSubmit} loading={loteLoading} icon="receipt_long">
                Emitir Recibos
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Report Wizard Modal */}
      <Modal
        isOpen={relatorioOpen}
        onClose={() => setRelatorioOpen(false)}
        title="Gerar Relatório Mensal"
        description={
          availableYears.length === 0
            ? "Nenhum recibo cadastrado ainda"
            : !selectedYear
            ? "Selecione o ano"
            : "Selecione o mês"
        }
        size="sm"
      >
        <div className="space-y-4">
          {availableYears.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="size-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-[var(--text-quaternary)]">inbox</span>
              </div>
              <p className="text-[var(--text-tertiary)] text-[14px]">Cadastre recibos para gerar relatórios</p>
            </div>
          ) : !selectedYear ? (
            <div className="grid grid-cols-2 gap-3">
              {availableYears.map((year) => {
                const count = availableData.filter((d) => d.ano === year).length;
                return (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="flex flex-col items-center gap-1 p-4 rounded-xl border border-[var(--border-primary)] bg-[var(--surface-primary)] hover:border-[#00AEEF] hover:bg-[rgba(0,174,239,0.05)] transition-all cursor-pointer"
                  >
                    <span className="text-[var(--text-primary)] text-[20px] font-bold">{year}</span>
                    <span className="text-[var(--text-tertiary)] text-[12px]">{count} {count === 1 ? "mês" : "meses"}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <button
                onClick={() => { setSelectedYear(null); setSelectedMonth(null); setRelatorioError(""); }}
                className="inline-flex items-center gap-1 text-[#00AEEF] text-[14px] font-medium hover:underline cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                {selectedYear}
              </button>
              <div className="grid grid-cols-3 gap-3">
                {availableMonthsList.map((mes) => (
                  <button
                    key={mes}
                    onClick={() => setSelectedMonth(mes)}
                    className={`flex items-center justify-center p-3 rounded-xl border text-[14px] font-medium transition-all cursor-pointer ${
                      selectedMonth === mes
                        ? "border-[#00AEEF] bg-[#00AEEF] text-white"
                        : "border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-primary)] hover:border-[#00AEEF] hover:bg-[rgba(0,174,239,0.05)]"
                    }`}
                  >
                    {MESES[mes - 1]}
                  </button>
                ))}
              </div>
            </>
          )}

          {relatorioError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {relatorioError}
            </div>
          )}

          {selectedYear && (
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRelatorioOpen(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleViewRelatorio} loading={relatorioLoading} icon="visibility" disabled={!selectedMonth}>
                Visualizar
              </Button>
            </div>
          )}
        </div>
      </Modal>

      {/* Relatório PDF Viewer */}
      {relatorioPdfUrl && (
        relatorioFullscreen ? (
          <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--surface-primary)] border-b border-[var(--border-primary)]">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center size-9 rounded-lg bg-[rgba(0,174,239,0.1)]">
                  <span className="material-symbols-outlined text-[#00AEEF] text-[20px]">summarize</span>
                </div>
                <div>
                  <p className="text-[var(--text-primary)] text-[14px] font-semibold">Relatório Mensal</p>
                  <p className="text-[var(--text-tertiary)] text-[11px]">{relatorioPdfLabel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadRelatorio} icon="download" size="sm" variant="secondary">Baixar</Button>
                <button onClick={() => setRelatorioFullscreen(false)}
                  className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Sair da tela cheia">
                  <span className="material-symbols-outlined text-[20px]">fullscreen_exit</span>
                </button>
                <button onClick={closeRelatorioPdf}
                  className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="flex-1">
              <iframe src={relatorioPdfUrl} className="w-full h-full" title="Relatório Mensal PDF" />
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-50 flex flex-col p-4 md:p-8">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeRelatorioPdf} />
            <div className="relative flex flex-col w-full h-full max-w-5xl mx-auto z-10">
              <div className="flex items-center justify-between bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-t-2xl px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(0,174,239,0.1)]">
                    <span className="material-symbols-outlined text-[#00AEEF] text-[22px]">summarize</span>
                  </div>
                  <div>
                    <h2 className="text-[var(--text-primary)] text-[16px] font-bold">Relatório Mensal</h2>
                    <p className="text-[var(--text-tertiary)] text-[12px]">{relatorioPdfLabel}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleDownloadRelatorio} icon="download" size="sm">Baixar PDF</Button>
                  <div className="w-px h-6 bg-[var(--border-primary)] mx-1" />
                  <button onClick={() => setRelatorioFullscreen(true)}
                    className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors" title="Tela cheia">
                    <span className="material-symbols-outlined text-[20px]">fullscreen</span>
                  </button>
                  <button onClick={closeRelatorioPdf}
                    className="size-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-[var(--bg-tertiary)] border-x border-b border-[var(--border-primary)] rounded-b-2xl overflow-hidden">
                <iframe src={relatorioPdfUrl} className="w-full h-full" title="Relatório Mensal PDF" />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
