import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalClientes, totalRecibos, recibosRecentes, faturamentoMensal] =
      await Promise.all([
        prisma.cliente.count(),
        prisma.recibo.count(),
        prisma.recibo.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            cliente: {
              select: { nome: true },
            },
          },
        }),
        prisma.recibo.aggregate({
          _sum: { total: true },
          where: {
            mesReferencia: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        totalClientes,
        totalRecibos,
        recibosRecentes: recibosRecentes.map((r) => ({
          id: r.id,
          mesReferencia: r.mesReferencia,
          total: Number(r.total),
          status: r.status,
          cliente: r.cliente,
        })),
        faturamentoMensal: Number(faturamentoMensal._sum.total || 0),
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
