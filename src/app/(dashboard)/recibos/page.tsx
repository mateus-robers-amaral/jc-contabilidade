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
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [wizardOpen, setWizardOpen] = useState(searchParams.get("new") === "true");
  const [editingRecibo, setEditingRecibo] = useState<Recibo | null>(null);
  const [previewRecibo, setPreviewRecibo] = useState<Recibo | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Recibo | null>(null);

  // Email state
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);
  const [emailModal, setEmailModal] = useState<Recibo | null>(null);
  const [emailAssunto, setEmailAssunto] = useState("");
  const [emailMensagem, setEmailMensagem] = useState("");

  // Relatório state
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [availableData, setAvailableData] = useState<{ ano: number; mes: number }[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [relatorioLoading, setRelatorioLoading] = useState(false);
  const [relatorioError, setRelatorioError] = useState("");
  const [relatorioPdfUrl, setRelatorioPdfUrl] = useState<string | null>(null);
  const [relatorioPdfLabel, setRelatorioPdfLabel] = useState("");
  const [emailError, setEmailError] = useState("");

  const fetchRecibos = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (search) params.append("search", search);

      const res = await fetch(`/api/recibos?${params}`);
      const data: ApiResponse<PaginatedResponse<Recibo>> = await res.json();

      if (data.success && data.data) {
        setRecibos(data.data.data);
      }
    } catch (error) {
      console.error("Error fetching recibos:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

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

  const handleViewRelatorio = async () => {
    if (!selectedYear || !selectedMonth) return;
    setRelatorioLoading(true);
    setRelatorioError("");
    try {
      const mesParam = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
      const res = await fetch(`/api/relatorios/mensal?mes=${mesParam}`);
      if (!res.ok) {
        const err = await res.json();
        setRelatorioError(err.error || "Erro ao gerar relatório");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setRelatorioPdfUrl(url);
      setRelatorioPdfLabel(`${MESES[selectedMonth - 1]} ${selectedYear}`);
      setRelatorioOpen(false);
    } catch {
      setRelatorioError("Erro ao conectar com o servidor");
    } finally {
      setRelatorioLoading(false);
    }
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
    if (relatorioPdfUrl) URL.revokeObjectURL(relatorioPdfUrl);
    setRelatorioPdfUrl(null);
  };

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

  // Global stats
  const stats = useMemo(() => {
    const currentKey = mesAnoKey(new Date());
    const currentMonth = monthGroups.find((g) => g.key === currentKey);
    return {
      totalGeral: recibos.reduce((sum, r) => sum + Number(r.total), 0),
      totalRecibos: recibos.length,
      mesAtual: currentMonth,
    };
  }, [recibos, monthGroups]);

  // Collapsed months state
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const toggleMonth = (key: string) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecibos();
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
    try {
      const res = await fetch(`/api/recibos/${recibo.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: newStatus }),
      });
      const data: ApiResponse = await res.json();
      if (data.success) fetchRecibos();
    } catch (error) { console.error("Error updating status:", error); }
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
        setEmailSuccess(reciboId);
        setTimeout(() => setEmailSuccess(null), 4000);
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
          <Button onClick={openNewWizard} icon="add">Novo Recibo</Button>
        </div>
      </div>

      {/* Stats Cards */}
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
          <p className="text-[var(--text-tertiary)] text-[12px] font-medium uppercase tracking-wide">Mês Atual — Pagos</p>
          <p className="text-[var(--text-primary)] text-[24px] font-bold">
            {stats.mesAtual ? `${stats.mesAtual.pagos} de ${stats.mesAtual.recibos.length}` : "—"}
          </p>
        </div>
        <div className="flex flex-col p-5 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm">
          <div className="flex items-center justify-center size-10 rounded-xl bg-[rgba(255,149,0,0.1)] mb-3">
            <span className="material-symbols-outlined text-[#FF9500] text-[22px]">schedule</span>
          </div>
          <p className="text-[var(--text-tertiary)] text-[12px] font-medium uppercase tracking-wide">Mês Atual — Pendentes</p>
          <p className="text-[var(--text-primary)] text-[24px] font-bold">
            {stats.mesAtual ? formatCurrency(stats.mesAtual.recibos.filter((r) => r.status === "pendente").reduce((s, r) => s + Number(r.total), 0)) : "—"}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-[var(--surface-primary)] p-2 rounded-2xl border border-[var(--border-primary)] shadow-sm">
        <div className="relative flex-1 min-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[var(--text-tertiary)] text-[20px]">search</span>
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus:border-[#00AEEF] focus:ring-4 focus:ring-[rgba(0,174,239,0.15)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-[14px] transition-all outline-none"
            placeholder="Buscar por nome do cliente..." />
        </div>
        <Button type="submit" variant="secondary" size="sm">Buscar</Button>
      </form>

      {/* Loading */}
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
        /* Month Groups */
        <div className="flex flex-col gap-4">
          {monthGroups.map((group) => (
            <div key={group.key} className="bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-2xl overflow-hidden shadow-sm">
              {/* Month Header */}
              <button
                onClick={() => toggleMonth(group.key)}
                className="w-full flex items-center justify-between px-6 py-4 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-10 rounded-xl bg-[#2E3192]">
                    <span className="material-symbols-outlined text-white text-[20px]">calendar_month</span>
                  </div>
                  <div className="text-left">
                    <p className="text-[var(--text-primary)] text-[16px] font-bold">{group.label}</p>
                    <p className="text-[var(--text-tertiary)] text-[12px]">
                      {group.recibos.length} recibo{group.recibos.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="hidden sm:flex items-center gap-4">
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#34C759]">
                      <span className="size-2 rounded-full bg-[#34C759]" />{group.pagos} pago{group.pagos !== 1 ? "s" : ""}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#FF9500]">
                      <span className="size-2 rounded-full bg-[#FF9500]" />{group.pendentes} pendente{group.pendentes !== 1 ? "s" : ""}
                    </span>
                    {group.cancelados > 0 && (
                      <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#FF3B30]">
                        <span className="size-2 rounded-full bg-[#FF3B30]" />{group.cancelados}
                      </span>
                    )}
                  </div>
                  <p className="text-[#00AEEF] text-[16px] font-bold">{formatCurrency(group.total)}</p>
                  <span className={`material-symbols-outlined text-[var(--text-tertiary)] transition-transform ${collapsedMonths.has(group.key) ? "" : "rotate-180"}`}>
                    expand_more
                  </span>
                </div>
              </button>

              {/* Recibos Table */}
              {!collapsedMonths.has(group.key) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-t border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                        <th className="px-6 py-3 text-[var(--text-tertiary)] text-[11px] uppercase font-semibold tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-[var(--text-tertiary)] text-[11px] uppercase font-semibold tracking-wider">Valor</th>
                        <th className="px-6 py-3 text-[var(--text-tertiary)] text-[11px] uppercase font-semibold tracking-wider">Status</th>
                        <th className="px-6 py-3 text-[var(--text-tertiary)] text-[11px] uppercase font-semibold tracking-wider text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-secondary)]">
                      {group.recibos.map((recibo) => (
                        <tr key={recibo.id} onClick={() => setPreviewRecibo(recibo)} className="group hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center size-8 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-semibold text-[11px]">
                                {recibo.cliente ? getInitials(recibo.cliente.nome) : "??"}
                              </div>
                              <span className="text-[var(--text-primary)] font-medium text-[13px]">
                                {recibo.cliente?.nome || "Cliente removido"}
                              </span>
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
                              <button onClick={() => openEmailModal(recibo)} disabled={!!sendingEmail}
                                className={`size-8 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
                                  emailSuccess === recibo.id ? "text-[#34C759] bg-[rgba(52,199,89,0.1)]" : "text-[var(--text-tertiary)] hover:text-[#5856D6] hover:bg-[rgba(88,86,214,0.1)]"
                                }`} title={recibo.cliente?.email ? `Enviar para ${recibo.cliente.email}` : "Cliente sem e-mail"}>
                                <span className="material-symbols-outlined text-[18px]">
                                  {emailSuccess === recibo.id ? "check_circle" : "mail"}
                                </span>
                              </button>
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
              )}
            </div>
          ))}
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

      {/* PDF Viewer Modal */}
      {relatorioPdfUrl && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeRelatorioPdf} />
          <div className="relative flex flex-col w-full h-full max-w-5xl mx-auto p-4 md:p-8">
            {/* Header */}
            <div className="flex items-center justify-between bg-[var(--surface-primary)] border border-[var(--border-primary)] rounded-t-2xl px-6 py-4 z-10">
              <div>
                <h2 className="text-[var(--text-primary)] text-[18px] font-bold">Relatório Mensal</h2>
                <p className="text-[var(--text-tertiary)] text-[13px]">{relatorioPdfLabel}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleDownloadRelatorio} icon="download" size="sm">
                  Baixar PDF
                </Button>
                <button
                  onClick={closeRelatorioPdf}
                  className="flex items-center justify-center size-10 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
            </div>
            {/* PDF iframe */}
            <div className="flex-1 bg-[var(--bg-tertiary)] border-x border-b border-[var(--border-primary)] rounded-b-2xl overflow-hidden">
              <iframe
                src={relatorioPdfUrl}
                className="w-full h-full"
                title="Relatório Mensal PDF"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
