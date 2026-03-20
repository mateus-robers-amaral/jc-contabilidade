import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, getCurrentUser } from "@/lib/auth";
import type { ApiResponse } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PUT /api/users/:id - Update user
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sem permissão" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { name, email, password, role } = await request.json();

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    // Check email uniqueness if changing
    if (email && email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) {
        return NextResponse.json<ApiResponse>(
          { success: false, error: "E-mail já está em uso" },
          { status: 409 }
        );
      }
    }

    if (password && password.length < 6) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const updateData: Record<string, string> = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) updateData.password = await hashPassword(password);

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: user,
      message: "Usuário atualizado com sucesso",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao atualizar usuário" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id - Delete user
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Sem permissão" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prevent self-deletion
    if (currentUser.userId === id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "Usuário excluído com sucesso",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao excluir usuário" },
      { status: 500 }
    );
  }
}
