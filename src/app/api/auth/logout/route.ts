import { NextResponse } from "next/server";
import { removeAuthCookie } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function POST() {
  try {
    await removeAuthCookie();

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Logout realizado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
