import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import type { ApiResponse } from "@/types";

// GET /api/users - List all users
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json<ApiResponse>({ success: true, data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar usuários" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sem permissão" },
        { status: 403 }
      );
    }

    const { name, email, password, role } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "E-mail já cadastrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "admin",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, data: user, message: "Usuário criado com sucesso" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao criar usuário" },
      { status: 500 }
    );
  }
}
