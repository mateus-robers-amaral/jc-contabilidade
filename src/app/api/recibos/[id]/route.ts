import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, Recibo, UpdateReciboDTO } from "@/types";
import { calculateTotal } from "@/lib/utils";

const MATERIAL_EXPEDIENTE = 5.0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/recibos/[id] - Get a single recibo
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const recibo = await prisma.recibo.findUnique({
      where: { id },
      include: {
        cliente: true,
      },
    });

    if (!recibo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Recibo nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Recibo>>({
      success: true,
      data: recibo as unknown as Recibo,
    });
  } catch (error) {
    console.error("Error fetching recibo:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar recibo" },
      { status: 500 }
    );
  }
}

// PUT /api/recibos/[id] - Update a recibo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateReciboDTO = await request.json();

    // Check if recibo exists
    const existingRecibo = await prisma.recibo.findUnique({
      where: { id },
    });

    if (!existingRecibo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Recibo nao encontrado" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (body.clienteId) {
      const cliente = await prisma.cliente.findUnique({
        where: { id: body.clienteId },
      });
      if (!cliente) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "Cliente nao encontrado" },
          { status: 404 }
        );
      }
      updateData.clienteId = body.clienteId;
    }

    if (body.mesReferencia) {
      const [year, month] = body.mesReferencia.split("-").map(Number);
      updateData.mesReferencia = new Date(year, month - 1, 1);
    }

    if (body.honorario !== undefined) updateData.honorario = Number(body.honorario);
    if (body.decimoTerceiro !== undefined) updateData.decimoTerceiro = Number(body.decimoTerceiro);
    if (body.registro !== undefined) updateData.registro = Number(body.registro);
    if (body.alteracao !== undefined) updateData.alteracao = Number(body.alteracao);
    if (body.outros !== undefined) updateData.outros = Number(body.outros);
    if (body.detalhamento !== undefined) updateData.detalhamento = body.detalhamento || null;
    if (body.status) updateData.status = body.status;

    // Recalculate total if any value changed
    const honorario = (updateData.honorario as number) ?? Number(existingRecibo.honorario);
    const decimoTerceiro = (updateData.decimoTerceiro as number) ?? Number(existingRecibo.decimoTerceiro);
    const registro = (updateData.registro as number) ?? Number(existingRecibo.registro);
    const alteracao = (updateData.alteracao as number) ?? Number(existingRecibo.alteracao);
    const outros = (updateData.outros as number) ?? Number(existingRecibo.outros);

    updateData.total = calculateTotal({
      honorario,
      decimoTerceiro,
      registro,
      alteracao,
      materialExpediente: MATERIAL_EXPEDIENTE,
      outros,
    });

    const recibo = await prisma.recibo.update({
      where: { id },
      data: updateData,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    return NextResponse.json<ApiResponse<Recibo>>({
      success: true,
      data: recibo as unknown as Recibo,
      message: "Recibo atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating recibo:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao atualizar recibo" },
      { status: 500 }
    );
  }
}

// DELETE /api/recibos/[id] - Delete a recibo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if recibo exists
    const existingRecibo = await prisma.recibo.findUnique({
      where: { id },
    });

    if (!existingRecibo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Recibo nao encontrado" },
        { status: 404 }
      );
    }

    await prisma.recibo.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Recibo excluido com sucesso",
    });
  } catch (error) {
    console.error("Error deleting recibo:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao excluir recibo" },
      { status: 500 }
    );
  }
}
