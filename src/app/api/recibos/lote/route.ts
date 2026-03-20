import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import { calculateTotal } from "@/lib/utils";

const MATERIAL_EXPEDIENTE = 5.0;

// POST /api/recibos/lote - Create recibos for all clients with honorarioPadrao
export async function POST(request: NextRequest) {
  try {
    const { mesReferencia } = await request.json();

    if (!mesReferencia || !/^\d{4}-\d{2}$/.test(mesReferencia)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Mês de referência obrigatório no formato YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, month] = mesReferencia.split("-").map(Number);
    const mesReferenciaDate = new Date(year, month - 1, 1);

    // Get all clients with honorarioPadrao set
    const clientes = await prisma.cliente.findMany({
      where: {
        honorarioPadrao: { not: null },
      },
      select: {
        id: true,
        nome: true,
        honorarioPadrao: true,
      },
    });

    if (clientes.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nenhum cliente possui honorário padrão cadastrado" },
        { status: 400 }
      );
    }

    // Check which clients already have recibos for this month
    const existingRecibos = await prisma.recibo.findMany({
      where: { mesReferencia: mesReferenciaDate },
      select: { clienteId: true },
    });
    const existingClienteIds = new Set(existingRecibos.map((r) => r.clienteId));

    const clientesToCreate = clientes.filter((c) => !existingClienteIds.has(c.id));

    if (clientesToCreate.length === 0) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Todos os clientes já possuem recibo neste mês" },
        { status: 409 }
      );
    }

    // Create recibos in batch
    const created = await prisma.$transaction(
      clientesToCreate.map((c) => {
        const honorario = Number(c.honorarioPadrao);
        const total = calculateTotal({
          honorario,
          decimoTerceiro: 0,
          registro: 0,
          alteracao: 0,
          materialExpediente: MATERIAL_EXPEDIENTE,
          outros: 0,
        });

        return prisma.recibo.create({
          data: {
            clienteId: c.id,
            mesReferencia: mesReferenciaDate,
            honorario,
            decimoTerceiro: 0,
            registro: 0,
            alteracao: 0,
            materialExpediente: MATERIAL_EXPEDIENTE,
            outros: 0,
            total,
            status: "pendente",
          },
        });
      })
    );

    const skipped = clientes.length - clientesToCreate.length;

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        data: { created: created.length, skipped },
        message: `${created.length} recibos criados com sucesso${skipped > 0 ? ` (${skipped} já existiam)` : ""}`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bulk recibos:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar recibos em lote" },
      { status: 500 }
    );
  }
}
