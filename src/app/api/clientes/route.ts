import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, PaginatedResponse, Cliente, CreateClienteDTO } from "@/types";
import { parseCNPJ, validateCNPJ } from "@/lib/utils";

// GET /api/clientes - List all clients with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: parseCNPJ(search) } },
          ],
        }
      : {};

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.cliente.count({ where }),
    ]);

    return NextResponse.json<ApiResponse<PaginatedResponse<Cliente>>>({
      success: true,
      data: {
        data: clientes as unknown as Cliente[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching clientes:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar clientes" },
      { status: 500 }
    );
  }
}

// POST /api/clientes - Create a new client
export async function POST(request: NextRequest) {
  try {
    const body: CreateClienteDTO = await request.json();
    const { nome, cnpj, email, responsavel } = body;

    if (!nome || !cnpj) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nome e CNPJ sao obrigatorios" },
        { status: 400 }
      );
    }

    const cleanedCNPJ = parseCNPJ(cnpj);

    if (!validateCNPJ(cleanedCNPJ)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "CNPJ invalido" },
        { status: 400 }
      );
    }

    // Check if CNPJ already exists
    const existingCliente = await prisma.cliente.findUnique({
      where: { cnpj: cleanedCNPJ },
    });

    if (existingCliente) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "CNPJ ja cadastrado" },
        { status: 409 }
      );
    }

    const cliente = await prisma.cliente.create({
      data: {
        nome,
        cnpj: cleanedCNPJ,
        email: email || null,
        responsavel: responsavel || null,
      },
    });

    return NextResponse.json<ApiResponse<Cliente>>(
      {
        success: true,
        data: cliente as unknown as Cliente,
        message: "Cliente cadastrado com sucesso",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating cliente:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao cadastrar cliente" },
      { status: 500 }
    );
  }
}
