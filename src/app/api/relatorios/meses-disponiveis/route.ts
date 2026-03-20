import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/relatorios/meses-disponiveis
// Returns distinct year-month combinations that have recibos
export async function GET() {
  try {
    const recibos = await prisma.recibo.findMany({
      select: { mesReferencia: true },
      orderBy: { mesReferencia: "desc" },
    });

    // Extract unique year-month combos
    const seen = new Set<string>();
    const result: { ano: number; mes: number }[] = [];

    for (const r of recibos) {
      const d = new Date(r.mesReferencia);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 });
      }
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error fetching available months:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar meses disponíveis" },
      { status: 500 }
    );
  }
}
