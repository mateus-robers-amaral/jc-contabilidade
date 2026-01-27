import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import prisma from "@/lib/prisma";
import ReciboPDF from "@/components/recibos/ReciboPDF";
import fs from "fs";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Read logo and convert to base64 data URL
function getLogoBase64(): string | null {
  try {
    const logoPath = path.join(process.cwd(), "public", "logoJC.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const base64 = logoBuffer.toString("base64");
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error("Error reading logo:", error);
    return null;
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Fetch recibo and settings in parallel
    const [recibo, settings] = await Promise.all([
      prisma.recibo.findUnique({
        where: { id },
        include: {
          cliente: {
            select: {
              nome: true,
              cnpj: true,
              email: true,
              responsavel: true,
            },
          },
        },
      }),
      prisma.settings.findUnique({
        where: { id: "default" },
      }),
    ]);

    if (!recibo) {
      return NextResponse.json(
        { success: false, error: "Recibo nao encontrado" },
        { status: 404 }
      );
    }

    // Get logo as base64
    const logoBase64 = getLogoBase64();

    // Convert Decimal fields to numbers for the PDF component
    const reciboData = {
      ...recibo,
      honorario: Number(recibo.honorario),
      decimoTerceiro: Number(recibo.decimoTerceiro),
      registro: Number(recibo.registro),
      alteracao: Number(recibo.alteracao),
      materialExpediente: Number(recibo.materialExpediente),
      outros: Number(recibo.outros),
      total: Number(recibo.total),
    };

    // Get PIX info if settings are configured
    let pixInfo: { chave: string; nomeBeneficiario: string } | null = null;
    if (settings?.pixKey && settings?.pixNomeBeneficiario) {
      pixInfo = {
        chave: settings.pixKey,
        nomeBeneficiario: settings.pixNomeBeneficiario,
      };
    }

    // Prepare contact info
    const contactInfo = settings ? {
      endereco: settings.endereco,
      telefone: settings.telefone,
      whatsapp: settings.whatsapp,
      email: settings.email,
    } : null;

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      ReciboPDF({
        recibo: reciboData,
        logoSrc: logoBase64,
        pixInfo,
        contactInfo,
      })
    );

    // Create filename
    const mesRef = new Date(recibo.mesReferencia);
    const monthYear = `${mesRef.getMonth() + 1}-${mesRef.getFullYear()}`;
    const clienteName = recibo.cliente.nome.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `recibo_${clienteName}_${monthYear}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao gerar PDF" },
      { status: 500 }
    );
  }
}
