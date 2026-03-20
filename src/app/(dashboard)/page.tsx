"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface DashboardData {
  faturamentoMesAtual: number;
  faturamentoMesAnterior: number;
  diffFaturamento: number;
  totalPendente: number;
  countPendente: number;
  clientesSemRecibo: number;
  totalClientes: number;
  recibosRecentes: {
    id: string;
    mesReferencia: string;
    total: number;
    status: string;
    cliente: { nome: string };
  }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatMonthYear(date: string | Date): string {
  const d = new Date(date);
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${months[d.getUTCMonth()]}/${d.getUTCFullYear()}`;
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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
          <Link
            href="/recibos"
            className="inline-flex items-center gap-2 h-11 px-5 rounded-xl border border-[var(--border-primary)] text-[var(--text-primary)] text-[15px] font-medium bg-[var(--surface-primary)] hover:bg-[var(--bg-tertiary)] transition-all"
          >
            <span className="material-symbols-outlined text-[20px]">receipt_long</span>
            <span>Ver Recibos</span>
          </Link>
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
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Faturamento do Mês */}
          <div className="flex flex-col p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center size-12 rounded-2xl bg-[rgba(0,174,239,0.1)]">
                <span className="material-symbols-outlined text-[24px] text-[#00AEEF]">payments</span>
              </div>
              {data.faturamentoMesAnterior > 0 && (
                <div className={`flex items-center gap-1 text-[13px] font-medium ${data.diffFaturamento >= 0 ? "text-[#34C759]" : "text-[#FF3B30]"}`}>
                  <span className="material-symbols-outlined text-[16px]">
                    {data.diffFaturamento >= 0 ? "trending_up" : "trending_down"}
                  </span>
                  <span>
                    {data.diffFaturamento >= 0 ? "+" : ""}
                    {formatCurrency(data.diffFaturamento)}
                  </span>
                </div>
              )}
            </div>
            <p className="text-[var(--text-tertiary)] text-[13px] font-medium mb-1">
              Faturamento do Mês
            </p>
            <p className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
              {formatCurrency(data.faturamentoMesAtual)}
            </p>
            {data.faturamentoMesAnterior > 0 && (
              <p className="text-[var(--text-tertiary)] text-[12px] mt-1">
                vs {formatCurrency(data.faturamentoMesAnterior)} mês anterior
              </p>
            )}
          </div>

          {/* A Receber */}
          <div className="flex flex-col p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center size-12 rounded-2xl bg-[rgba(255,149,0,0.1)]">
                <span className="material-symbols-outlined text-[24px] text-[#FF9500]">schedule</span>
              </div>
              {data.countPendente > 0 && (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold bg-[rgba(255,149,0,0.15)] text-[#FF9500]">
                  {data.countPendente} {data.countPendente === 1 ? "recibo" : "recibos"}
                </span>
              )}
            </div>
            <p className="text-[var(--text-tertiary)] text-[13px] font-medium mb-1">
              A Receber
            </p>
            <p className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
              {formatCurrency(data.totalPendente)}
            </p>
            <p className="text-[var(--text-tertiary)] text-[12px] mt-1">
              Pendente de pagamento
            </p>
          </div>

          {/* Clientes sem Recibo */}
          <div className="flex flex-col p-6 rounded-2xl bg-[var(--surface-primary)] border border-[var(--border-primary)] shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center justify-center size-12 rounded-2xl bg-[rgba(88,86,214,0.1)]">
                <span className="material-symbols-outlined text-[24px] text-[#5856D6]">group_off</span>
              </div>
              <span className="text-[var(--text-tertiary)] text-[12px] font-medium">
                de {data.totalClientes} clientes
              </span>
            </div>
            <p className="text-[var(--text-tertiary)] text-[13px] font-medium mb-1">
              Clientes sem Recibo
            </p>
            <p className="text-[var(--text-primary)] text-[28px] font-bold tracking-tight">
              {data.clientesSemRecibo}
            </p>
            <p className="text-[var(--text-tertiary)] text-[12px] mt-1">
              Sem recibo emitido este mês
            </p>
          </div>
        </div>
      )}

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

    </div>
  );
}
