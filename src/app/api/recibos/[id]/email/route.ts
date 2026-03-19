import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import ReciboPDF from "@/components/recibos/ReciboPDF";

export const maxDuration = 30;
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const customMessage: string | undefined = body.mensagem;
    const customSubject: string | undefined = body.assunto;

    // Fetch recibo and settings
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
      prisma.settings.findUnique({ where: { id: "default" } })
        .then((s) => s ?? prisma.settings.create({ data: { id: "default" } })),
    ]);

    if (!recibo) {
      return NextResponse.json(
        { success: false, error: "Recibo nao encontrado" },
        { status: 404 }
      );
    }

    if (!recibo.cliente.email) {
      return NextResponse.json(
        { success: false, error: "Cliente nao possui e-mail cadastrado" },
        { status: 400 }
      );
    }

    // Check SMTP config
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        { success: false, error: "Configuracoes de e-mail (SMTP) nao definidas no servidor" },
        { status: 500 }
      );
    }

    // Generate PDF
    const logoBase64 = getImageBase64("logoJC.png");
    const whatsappIcon = getImageBase64("whatsapp-icon.png");
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
      } catch {
        // QR code generation failed, continue without it
      }
    }

    const pdfBuffer = await renderToBuffer(
      ReciboPDF({
        recibo: reciboData,
        logoSrc: logoBase64,
        qrCodeSrc: qrCodeBase64,
        pixInfo,
        whatsappIconSrc: whatsappIcon,
      })
    );

    // Format month/year
    const mesRef = new Date(recibo.mesReferencia);
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
    ];
    const mesAno = `${meses[mesRef.getMonth()]}/${mesRef.getFullYear()}`;
    const clienteName = recibo.cliente.nome;
    const valor = Number(recibo.total).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    // Build filename
    const monthYear = `${mesRef.getMonth() + 1}-${mesRef.getFullYear()}`;
    const safeClienteName = clienteName.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `recibo_${safeClienteName}_${monthYear}.pdf`;

    // Send email via Gmail SMTP
    console.log(`[EMAIL] Enviando para: ${recibo.cliente.email}`);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        servername: "smtp.gmail.com",
      },
      // Forçar IPv4 (Railway não suporta IPv6)
      family: 4,
    });

    await transporter.sendMail({
      from: `"J AMARAL CONTABIL" <${smtpUser}>`,
      to: recibo.cliente.email,
      subject: customSubject || `Recibo de Honorários - ${mesAno} | J AMARAL CONTABIL`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="background: #2E3192; padding: 24px; border-radius: 12px 12px 0 0;">
            <h1 style="color: #fff; margin: 0; font-size: 20px;">J AMARAL CONTABIL</h1>
            <p style="color: rgba(255,255,255,0.7); margin: 4px 0 0; font-size: 13px;">Gestão Fiscal e Contábil</p>
          </div>

          <div style="background: #f9fafb; padding: 28px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 15px; margin: 0 0 16px;">
              Prezado(a) <strong>${recibo.cliente.responsavel || clienteName}</strong>,
            </p>

            <p style="font-size: 14px; color: #555; line-height: 1.6; margin: 0 0 20px; white-space: pre-line;">
              ${customMessage || `Segue em anexo o recibo de honorários contábeis referente a ${mesAno}, no valor de ${valor}.`}
            </p>

            <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 0 0 20px;">
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="color: #888; padding: 4px 0;">Cliente:</td>
                  <td style="text-align: right; font-weight: 600;">${clienteName}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 4px 0;">Referência:</td>
                  <td style="text-align: right; font-weight: 600;">${mesAno}</td>
                </tr>
                <tr>
                  <td style="color: #888; padding: 4px 0;">Valor Total:</td>
                  <td style="text-align: right; font-weight: 600; color: #00AEEF;">${valor}</td>
                </tr>
              </table>
            </div>

            ${settings?.pixKey ? `
            <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0 0 20px;">
              O pagamento pode ser realizado via <strong>PIX</strong> utilizando a chave
              informada no recibo em anexo.
            </p>
            ` : ""}

            <p style="font-size: 13px; color: #555; line-height: 1.5; margin: 0;">
              Em caso de dúvidas, entre em contato pelo telefone (27) 3336-3213
              ou WhatsApp (27) 99524-6812.
            </p>
          </div>

          <div style="background: #2E3192; padding: 16px 24px; border-radius: 0 0 12px 12px; text-align: center;">
            <p style="color: rgba(255,255,255,0.7); font-size: 11px; margin: 0;">
              Jean Claude Rezende do Amaral - Contador - CRC-ES 008870/O-5
            </p>
            <p style="color: rgba(255,255,255,0.5); font-size: 10px; margin: 4px 0 0;">
              Rua Adley, 108, Morada de Santa Fé, Cariacica/ES - CEP 29.143-719
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename,
          content: Buffer.from(pdfBuffer),
          contentType: "application/pdf",
        },
      ],
    });

    console.log(`[EMAIL] Enviado com sucesso para ${recibo.cliente.email}`);
    return NextResponse.json({
      success: true,
      message: `Recibo enviado para ${recibo.cliente.email}`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido";
    const stack = error instanceof Error ? error.stack : "";
    console.error(`[EMAIL] ERRO: ${msg}`);
    console.error(`[EMAIL] Stack: ${stack}`);
    return NextResponse.json(
      { success: false, error: `Erro ao enviar e-mail: ${msg}` },
      { status: 500 }
    );
  }
}
