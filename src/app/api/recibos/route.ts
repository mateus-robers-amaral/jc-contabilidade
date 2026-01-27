import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, PaginatedResponse, Recibo, CreateReciboDTO } from "@/types";
import { calculateTotal } from "@/lib/utils";

const MATERIAL_EXPEDIENTE = 5.0;

// GET /api/recibos - List all recibos with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const clienteId = searchParams.get("clienteId");
    const mes = searchParams.get("mes");
    const ano = searchParams.get("ano");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (mes && ano) {
      const startDate = new Date(parseInt(ano), parseInt(mes) - 1, 1);
      const endDate = new Date(parseInt(ano), parseInt(mes), 0);
      where.mesReferencia = {
        gte: startDate,
        lte: endDate,
      };
    } else if (ano) {
      const startDate = new Date(parseInt(ano), 0, 1);
      const endDate = new Date(parseInt(ano), 11, 31);
      where.mesReferencia = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.cliente = {
        nome: { contains: search, mode: "insensitive" },
      };
    }

    const [recibos, total] = await Promise.all([
      prisma.recibo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { mesReferencia: "desc" },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
            },
          },
        },
      }),
      prisma.recibo.count({ where }),
    ]);

    return NextResponse.json<ApiResponse<PaginatedResponse<Recibo>>>({
      success: true,
      data: {
        data: recibos as unknown as Recibo[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching recibos:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar recibos" },
      { status: 500 }
    );
  }
}

// POST /api/recibos - Create a new recibo
export async function POST(request: NextRequest) {
  try {
    const body: CreateReciboDTO = await request.json();
    const {
      clienteId,
      mesReferencia,
      honorario,
      decimoTerceiro = 0,
      registro = 0,
      alteracao = 0,
      outros = 0,
      detalhamento,
    } = body;

    if (!clienteId || !mesReferencia || honorario === undefined) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente, mes de referencia e honorario sao obrigatorios" },
        { status: 400 }
      );
    }

    // Check if cliente exists
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
    });

    if (!cliente) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Cliente nao encontrado" },
        { status: 404 }
      );
    }

    // Calculate total
    const total = calculateTotal({
      honorario: Number(honorario),
      decimoTerceiro: Number(decimoTerceiro),
      registro: Number(registro),
      alteracao: Number(alteracao),
      materialExpediente: MATERIAL_EXPEDIENTE,
      outros: Number(outros),
    });

    // Parse month reference date
    const [year, month] = mesReferencia.split("-").map(Number);
    const mesReferenciaDate = new Date(year, month - 1, 1);

    // Check for duplicate recibo
    const existingRecibo = await prisma.recibo.findFirst({
      where: {
        clienteId,
        mesReferencia: mesReferenciaDate,
      },
    });

    if (existingRecibo) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Ja existe um recibo para este cliente neste mes" },
        { status: 409 }
      );
    }

    const recibo = await prisma.recibo.create({
      data: {
        clienteId,
        mesReferencia: mesReferenciaDate,
        honorario: Number(honorario),
        decimoTerceiro: Number(decimoTerceiro),
        registro: Number(registro),
        alteracao: Number(alteracao),
        materialExpediente: MATERIAL_EXPEDIENTE,
        outros: Number(outros),
        detalhamento: detalhamento || null,
        total,
        status: "pendente",
      },
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

    return NextResponse.json<ApiResponse<Recibo>>(
      {
        success: true,
        data: recibo as unknown as Recibo,
        message: "Recibo criado com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating recibo:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar recibo" },
      { status: 500 }
    );
  }
}
