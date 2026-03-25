import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import prisma from "@/lib/prisma";
import ReciboPDF from "@/components/recibos/ReciboPDF";
import { generatePixQRCode } from "@/lib/pix";
import fs from "fs";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getImageBase64(filename: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "public", filename);
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
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
      }).then((s) => s ?? prisma.settings.create({ data: { id: "default" } })),
    ]);

    if (!recibo) {
      return NextResponse.json(
        { success: false, error: "Recibo nao encontrado" },
        { status: 404 }
      );
    }

    // Get images as base64
    const logoBase64 = getImageBase64("logoJC.png");
    const whatsappIcon = getImageBase64("whatsapp-icon.png");

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

    // Get PIX info and generate QR code if settings are configured
    let pixInfo: { chave: string; nomeBeneficiario: string; tipo: string } | null = null;
    let qrCodeBase64: string | null = null;
    if (settings?.pixKey && settings?.pixNomeBeneficiario && settings?.pixCidade) {
      pixInfo = {
        chave: settings.pixKey,
        nomeBeneficiario: settings.pixNomeBeneficiario,
        tipo: settings.pixKeyType || "cnpj",
      };

      try {
        qrCodeBase64 = await generatePixQRCode({
          pixKey: settings.pixKey,
          pixKeyType: settings.pixKeyType || "cnpj",
          nomeBeneficiario: settings.pixNomeBeneficiario,
          cidade: settings.pixCidade,
          valor: Number(recibo.total),
          identificador: recibo.id.slice(-25),
        });
      } catch (error) {
        console.error("Error generating PIX QR Code:", error);
      }
    }

    // Generate PDF buffer
    const pdfBuffer = await renderToBuffer(
      ReciboPDF({
        recibo: reciboData,
        logoSrc: logoBase64,
        qrCodeSrc: qrCodeBase64,
        pixInfo,
        whatsappIconSrc: whatsappIcon,
      })
    );

    // Create filename
    const mesRef = new Date(recibo.mesReferencia);
    const monthYear = `${mesRef.getUTCMonth() + 1}-${mesRef.getUTCFullYear()}`;
    const clienteName = (recibo.cliente?.nome || recibo.avulsoNome || "avulso").replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `recibo_${clienteName}_${monthYear}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
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
