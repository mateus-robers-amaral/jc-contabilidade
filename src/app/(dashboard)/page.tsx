"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Modal, Button } from "@/components/ui";

interface DashboardData {
  totalClientes: number;
  totalRecibos: number;
  faturamentoMensal: number;
  recibosRecentes: {
    id: string;
    mesReferencia: string;
    total: number;
    status: string;
    cliente: { nome: string };
  }[];
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatMonthYear(date: string | Date): string {
  const d = new Date(date);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[d.getMonth()]}/${d.getFullYear()}`;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatorioOpen, setRelatorioOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [relatorioLoading, setRelatorioLoading] = useState(false);
  const [relatorioError, setRelatorioError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadRelatorio = async () => {
    setRelatorioLoading(true);
    setRelatorioError("");
    try {
      const res = await fetch(`/api/relatorios/mensal?mes=${selectedMonth}`);
      if (!res.ok) {
        const err = await res.json();
        setRelatorioError(err.error || "Erro ao gerar relatório");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const [year, month] = selectedMonth.split("-").map(Number);
      a.download = `relatorio_${MONTHS[month - 1].toLowerCase()}_${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setRelatorioOpen(false);
    } catch {
      setRelatorioError("Erro ao conectar com o servidor");
    } finally {
      setRelatorioLoading(false);
    }
  };

  // Generate month options (last 12 months + current)
  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    monthOptions.push({ value, label });
  }

  const stats = data
    ? [
        {
          label: "Recibos Emitidos",
          value: data.totalRecibos.toString(),
          icon: "receipt_long",
          color: "#00AEEF",
          bgColor: "rgba(0, 174, 239, 0.1)",
        },
        {
          label: "Clientes Ativos",
          value: data.totalClientes.toString(),
          icon: "groups",
          color: "#34C759",
          bgColor: "rgba(52, 199, 89, 0.1)",
        },
        {
          label: "Faturamento Mensal",
          value: formatCurrency(data.faturamentoMensal),
          icon: "payments",
          color: "#5856D6",
          bgColor: "rgba(88, 86, 214, 0.1)",
        },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="material-symbols-outlined animate-spin text-[#00AEEF] text-[32px]">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Page Heading & Actions */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
            Dashboard
          </h1>
          <p className="text-[var(--text-tertiary)] text-[15px]">
            Resumo das atividades fiscais recentes
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setRelatorioError("");
              setRelatorioOpen(true);
            }}
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-[15px] font-medium bg-[var(--surface-primary)] hover:bg-[var(--bg-tertiary)] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Relatório</span>
          </button>
          <Link
            href="/recibos?new=true"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-[#00AEEF] text-white text-[15px] font-semibold shadow-[0_2px_8px_rgba(0,174,239,0.3)] hover:shadow-[0_4px_16px_rgba(0,174,239,0.4)] hover:bg-[#0095CC] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Novo Recibo</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="flex items-center justify-center size-12 rounded-2xl"
                style={{ backgroundColor: stat.bgColor }}
              >
                <span
                  className="material-symbols-outlined text-[24px]"
                  style={{ color: stat.color }}
                >
                  {stat.icon}
                </span>
              </div>
            </div>
            <p className="text-[var(--text-tertiary)] text-[13px] font-medium mb-1">
              {stat.label}
            </p>
            <p className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Receipts */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[var(--text-primary)] text-[20px] font-bold">
            Últimos Recibos
          </h3>
          <Link
            href="/recibos"
            className="text-[#00AEEF] text-[15px] font-medium hover:underline flex items-center gap-1"
          >
            Ver todos
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--surface-primary)] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-secondary)] border-b border-[var(--border-primary)]">
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Referência
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Valor
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[12px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-secondary)]">
                {!data || data.recibosRecentes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="size-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[32px] text-[var(--text-quaternary)]">
                            inbox
                          </span>
                        </div>
                        <p className="text-[var(--text-tertiary)] text-[15px]">
                          Nenhum recibo cadastrado ainda
                        </p>
                        <Link
                          href="/recibos?new=true"
                          className="text-[#00AEEF] text-[14px] font-medium hover:underline"
                        >
                          Criar primeiro recibo
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.recibosRecentes.map((recibo) => (
                    <tr
                      key={recibo.id}
                      className="group hover:bg-[var(--bg-secondary)] transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="text-[var(--text-secondary)] text-[14px]">
                          {formatMonthYear(recibo.mesReferencia)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center size-9 rounded-full bg-gradient-to-br from-[#00AEEF] to-[#2E3192] text-white font-semibold text-[12px]">
                            {getInitials(recibo.cliente.nome)}
                          </div>
                          <span className="text-[var(--text-primary)] text-[14px] font-medium">
                            {recibo.cliente.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[var(--text-primary)] text-[14px] font-semibold">
                          {formatCurrency(Number(recibo.total))}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${
                            recibo.status === "pago"
                              ? "bg-[rgba(52,199,89,0.15)] text-[#34C759]"
                              : recibo.status === "cancelado"
                              ? "bg-[rgba(255,59,48,0.15)] text-[#FF3B30]"
                              : "bg-[rgba(255,149,0,0.15)] text-[#FF9500]"
                          }`}
                        >
                          {recibo.status === "pago"
                            ? "Pago"
                            : recibo.status === "cancelado"
                            ? "Cancelado"
                            : "Pendente"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/api/recibos/${recibo.id}/pdf`}
                          className="inline-flex items-center justify-center size-9 rounded-full text-[var(--text-tertiary)] hover:text-[#00AEEF] hover:bg-[rgba(0,174,239,0.1)] transition-all"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            download
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report Month Picker Modal */}
      <Modal
        isOpen={relatorioOpen}
        onClose={() => setRelatorioOpen(false)}
        title="Gerar Relatório Mensal"
        description="Selecione o mês para gerar o relatório em PDF"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[var(--text-primary)] text-[15px] font-medium mb-2">
              Mês de referência
            </label>
            <div className="relative flex items-center h-[52px] w-full rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-primary)] focus-within:border-[#00AEEF] focus-within:ring-4 focus-within:ring-[rgba(0,174,239,0.15)] transition-all">
              <div className="absolute left-4 text-[var(--text-tertiary)] pointer-events-none">
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
              </div>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full h-full bg-transparent pl-11 pr-4 rounded-xl text-[var(--text-primary)] focus:outline-none text-[15px] font-medium appearance-none cursor-pointer"
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 text-[var(--text-tertiary)] pointer-events-none">
                <span className="material-symbols-outlined text-[18px]">expand_more</span>
              </div>
            </div>
          </div>

          {relatorioError && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(255,59,48,0.1)] border border-[rgba(255,59,48,0.2)] text-[#FF3B30] text-[14px]">
              <span className="material-symbols-outlined text-[20px]">error</span>
              {relatorioError}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setRelatorioOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleDownloadRelatorio}
              loading={relatorioLoading}
              icon="download"
            >
              Baixar PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
