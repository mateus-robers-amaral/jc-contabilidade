import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, PaginatedResponse, Cliente, ClienteWithStats, CreateClienteDTO } from "@/types";
import { parseCNPJ, validateDocument } from "@/lib/utils";

const VALID_SORT_FIELDS = ["nome", "createdAt", "totalRecibos", "recibosCount"] as const;
const VALID_SORT_ORDERS = ["asc", "desc"] as const;

// GET /api/clientes - List all clients with pagination and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = searchParams.get("sortOrder") || "desc";

    const sortBy = VALID_SORT_FIELDS.includes(sortByParam as typeof VALID_SORT_FIELDS[number])
      ? sortByParam
      : "createdAt";
    const sortOrder = VALID_SORT_ORDERS.includes(sortOrderParam as typeof VALID_SORT_ORDERS[number])
      ? sortOrderParam
      : "desc";

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { nome: { contains: search, mode: "insensitive" as const } },
            { cnpj: { contains: parseCNPJ(search) } },
          ],
        }
      : {};

    // Aggregate sorts need in-memory processing
    const isAggregateSort = sortBy === "totalRecibos" || sortBy === "recibosCount";

    if (isAggregateSort) {
      const allClientes = await prisma.cliente.findMany({
        where,
        include: {
          _count: { select: { recibos: true } },
          recibos: { select: { total: true } },
        },
      });

      const clientesWithStats: ClienteWithStats[] = allClientes.map((c) => {
        const { recibos, _count, ...rest } = c;
        return {
          ...rest,
          totalFaturamento: recibos.reduce((sum, r) => sum + Number(r.total), 0),
          recibosCount: _count.recibos,
        } as ClienteWithStats;
      });

      clientesWithStats.sort((a, b) => {
        const key = sortBy === "totalRecibos" ? "totalFaturamento" : "recibosCount";
        return sortOrder === "asc" ? a[key] - b[key] : b[key] - a[key];
      });

      const total = clientesWithStats.length;
      const paginated = clientesWithStats.slice(skip, skip + limit);

      return NextResponse.json<ApiResponse<PaginatedResponse<ClienteWithStats>>>({
        success: true,
        data: {
          data: paginated,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      });
    }

    // Simple field sorts use Prisma native ordering
    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: { select: { recibos: true } },
          recibos: { select: { total: true } },
        },
      }),
      prisma.cliente.count({ where }),
    ]);

    const clientesWithStats: ClienteWithStats[] = clientes.map((c) => {
      const { recibos, _count, ...rest } = c;
      return {
        ...rest,
        totalFaturamento: recibos.reduce((sum, r) => sum + Number(r.total), 0),
        recibosCount: _count.recibos,
      } as ClienteWithStats;
    });

    return NextResponse.json<ApiResponse<PaginatedResponse<ClienteWithStats>>>({
      success: true,
      data: {
        data: clientesWithStats,
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
    const { nome, cnpj, email, responsavel, honorarioPadrao } = body;

    if (!nome || !cnpj) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nome e CPF/CNPJ são obrigatórios" },
        { status: 400 }
      );
    }

    const cleanedCNPJ = parseCNPJ(cnpj);

    if (!validateDocument(cleanedCNPJ)) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "CPF/CNPJ inválido" },
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
        honorarioPadrao: honorarioPadrao ? Number(honorarioPadrao) : null,
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
