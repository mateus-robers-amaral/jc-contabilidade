import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { ApiResponse, JWTPayload } from "@/types";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Nao autenticado" },
        { status: 401 }
      );
    }

    return NextResponse.json<ApiResponse<JWTPayload>>(
      { success: true, data: user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get current user error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
