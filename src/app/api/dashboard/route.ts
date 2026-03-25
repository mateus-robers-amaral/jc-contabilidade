import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const now = new Date();
    const mesAtualInicio = new Date(now.getFullYear(), now.getMonth(), 1);
    const mesAtualFim = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const mesAnteriorInicio = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const mesAnteriorFim = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalClientes,
      recibosRecentes,
      faturamentoMesAtual,
      faturamentoMesAnterior,
      pendentesAggregate,
      pendentesCount,
      clientesComReciboNoMes,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.recibo.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          cliente: { select: { nome: true } },
        },
      }),
      // Faturamento mês atual
      prisma.recibo.aggregate({
        _sum: { total: true },
        where: {
          mesReferencia: { gte: mesAtualInicio, lte: mesAtualFim },
        },
      }),
      // Faturamento mês anterior
      prisma.recibo.aggregate({
        _sum: { total: true },
        where: {
          mesReferencia: { gte: mesAnteriorInicio, lte: mesAnteriorFim },
        },
      }),
      // Total pendente (todos os meses)
      prisma.recibo.aggregate({
        _sum: { total: true },
        where: { status: "pendente" },
      }),
      prisma.recibo.count({
        where: { status: "pendente" },
      }),
      // Clientes que já têm recibo no mês atual
      prisma.recibo.findMany({
        where: {
          mesReferencia: { gte: mesAtualInicio, lte: mesAtualFim },
        },
        select: { clienteId: true },
        distinct: ["clienteId"],
      }),
    ]);

    const faturamentoAtual = Number(faturamentoMesAtual._sum.total || 0);
    const faturamentoAnterior = Number(faturamentoMesAnterior._sum.total || 0);
    const diffFaturamento = faturamentoAtual - faturamentoAnterior;
    const clientesSemRecibo = totalClientes - clientesComReciboNoMes.length;

    return NextResponse.json({
      success: true,
      data: {
        faturamentoMesAtual: faturamentoAtual,
        faturamentoMesAnterior: faturamentoAnterior,
        diffFaturamento,
        totalPendente: Number(pendentesAggregate._sum.total || 0),
        countPendente: pendentesCount,
        clientesSemRecibo,
        totalClientes,
        recibosRecentes: recibosRecentes.map((r) => ({
          id: r.id,
          mesReferencia: r.mesReferencia,
          total: Number(r.total),
          status: r.status,
          cliente: r.cliente,
          avulsoNome: r.avulsoNome,
          clienteId: r.clienteId,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar dados do dashboard" },
      { status: 500 }
    );
  }
}
