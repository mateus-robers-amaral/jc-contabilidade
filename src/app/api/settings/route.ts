import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { ApiResponse, Settings, UpdateSettingsDTO } from "@/types";

// GET /api/settings - Get current settings
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "default",
        },
      });
    }

    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings as unknown as Settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao buscar configuracoes" },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: NextRequest) {
  try {
    const body: UpdateSettingsDTO = await request.json();

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        pixKeyType: body.pixKeyType,
        pixKey: body.pixKey,
        pixNomeBeneficiario: body.pixNomeBeneficiario,
        pixCidade: body.pixCidade,
        endereco: body.endereco,
        telefone: body.telefone,
        whatsapp: body.whatsapp,
        email: body.email,
      },
      create: {
        id: "default",
        pixKeyType: body.pixKeyType,
        pixKey: body.pixKey,
        pixNomeBeneficiario: body.pixNomeBeneficiario,
        pixCidade: body.pixCidade,
        endereco: body.endereco,
        telefone: body.telefone,
        whatsapp: body.whatsapp,
        email: body.email,
      },
    });

    return NextResponse.json<ApiResponse<Settings>>({
      success: true,
      data: settings as unknown as Settings,
      message: "Configuracoes atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro ao atualizar configuracoes" },
      { status: 500 }
    );
  }
}
