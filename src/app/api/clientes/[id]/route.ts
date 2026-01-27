import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, Cliente, UpdateClienteDTO } from "@/types";
import { parseCNPJ, validateCNPJ } from "@/lib/utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/clientes/[id] - Get a single client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const cliente = await prisma.cliente.findUnique({
      where: { id },
      include: {
        recibos: {
          orderBy: { mesReferencia: "desc" },
          take: 5,
        },
      },
    });

    if (!cliente) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente nao encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<Cliente>>({
      success: true,
      data: cliente as unknown as Cliente,
    });
  } catch (error) {
    console.error("Error fetching cliente:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar cliente" },
      { status: 500 }
    );
  }
}

// PUT /api/clientes/[id] - Update a client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body: UpdateClienteDTO = await request.json();
    const { nome, cnpj, email, responsavel } = body;

    // Check if client exists
    const existingCliente = await prisma.cliente.findUnique({
      where: { id },
    });

    if (!existingCliente) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente nao encontrado" },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Partial<UpdateClienteDTO & { cnpj: string }> = {};

    if (nome) updateData.nome = nome;
    if (email !== undefined) updateData.email = email || undefined;
    if (responsavel !== undefined) updateData.responsavel = responsavel || undefined;

    // Handle CNPJ update
    if (cnpj) {
      const cleanedCNPJ = parseCNPJ(cnpj);

      if (!validateCNPJ(cleanedCNPJ)) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "CNPJ invalido" },
          { status: 400 }
        );
      }

      // Check if new CNPJ already exists (excluding current client)
      const cnpjExists = await prisma.cliente.findFirst({
        where: {
          cnpj: cleanedCNPJ,
          NOT: { id },
        },
      });

      if (cnpjExists) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "CNPJ ja cadastrado para outro cliente" },
          { status: 409 }
        );
      }

      updateData.cnpj = cleanedCNPJ;
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json<ApiResponse<Cliente>>({
      success: true,
      data: cliente as unknown as Cliente,
      message: "Cliente atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating cliente:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao atualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE /api/clientes/[id] - Delete a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if client exists
    const existingCliente = await prisma.cliente.findUnique({
      where: { id },
      include: { _count: { select: { recibos: true } } },
    });

    if (!existingCliente) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente nao encontrado" },
        { status: 404 }
      );
    }

    // Delete client (cascade will delete related recibos)
    await prisma.cliente.delete({
      where: { id },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `Cliente excluido com sucesso${
        existingCliente._count.recibos > 0
          ? ` (${existingCliente._count.recibos} recibos removidos)`
          : ""
      }`,
    });
  } catch (error) {
    console.error("Error deleting cliente:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao excluir cliente" },
      { status: 500 }
    );
  }
}
