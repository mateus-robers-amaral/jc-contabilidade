import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import prisma from "@/lib/prisma";
import RelatorioMensalPDF from "@/components/relatorios/RelatorioMensalPDF";
import fs from "fs";
import path from "path";

function getImageBase64(filename: string): string | null {
  try {
    const filePath = path.join(process.cwd(), "public", filename);
    const buffer = fs.readFileSync(filePath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// GET /api/relatorios/mensal?mes=2026-03
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mesParam = searchParams.get("mes");

    if (!mesParam || !/^\d{4}-\d{2}$/.test(mesParam)) {
      return NextResponse.json(
        { success: false, error: "Parâmetro 'mes' obrigatório no formato YYYY-MM" },
        { status: 400 }
      );
    }

    const [year, month] = mesParam.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const recibos = await prisma.recibo.findMany({
      where: {
        mesReferencia: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        cliente: {
          select: {
            nome: true,
            cnpj: true,
          },
        },
      },
    });

    if (recibos.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum recibo encontrado para este mês" },
        { status: 404 }
      );
    }

    // Map recibos to PDF format
    const reciboItems = recibos.map((r) => ({
      id: r.id,
      clienteNome: r.cliente?.nome || r.avulsoNome || "Avulso",
      clienteCnpj: r.cliente?.cnpj || r.avulsoCnpj || "",
      isAvulso: !r.clienteId,
      honorario: Number(r.honorario),
      decimoTerceiro: Number(r.decimoTerceiro),
      registro: Number(r.registro),
      alteracao: Number(r.alteracao),
      materialExpediente: Number(r.materialExpediente),
      outros: Number(r.outros),
      total: Number(r.total),
      status: r.status,
      dataPagamento: r.dataPagamento ? r.dataPagamento.toISOString() : null,
    }));

    // Calculate totals
    const totalGeral = reciboItems.reduce((s, r) => s + r.total, 0);

    const pagos = reciboItems.filter((r) => r.status === "pago");
    const pendentes = reciboItems.filter((r) => r.status === "pendente");
    const cancelados = reciboItems.filter((r) => r.status === "cancelado");

    const totalPagos = pagos.reduce((s, r) => s + r.total, 0);
    const totalPendentes = pendentes.reduce((s, r) => s + r.total, 0);
    const totalCancelados = cancelados.reduce((s, r) => s + r.total, 0);

    const logoBase64 = getImageBase64("logoJC.png");

    const mesLabel = `${MONTHS[month - 1]} ${year}`;

    const pdfBuffer = await renderToBuffer(
      RelatorioMensalPDF({
        mes: mesLabel,
        recibos: reciboItems,
        totalGeral,
        totalPagos,
        totalPendentes,
        totalCancelados,
        countPagos: pagos.length,
        countPendentes: pendentes.length,
        countCancelados: cancelados.length,
        logoSrc: logoBase64,
      })
    );

    const uint8Array = new Uint8Array(pdfBuffer);
    const filename = `relatorio_${MONTHS[month - 1].toLowerCase()}_${year}.pdf`;

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating monthly report:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao gerar relatório" },
      { status: 500 }
    );
  }
}
