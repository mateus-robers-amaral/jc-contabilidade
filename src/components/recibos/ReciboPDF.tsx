import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const DARK = "#111827";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const BORDER = "#d1d5db";
const ACCENT = "#00AEEF";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
    backgroundColor: "#ffffff",
  },

  // === THIN TOP LINE ===
  topLine: {
    height: 2,
    backgroundColor: BORDER,
  },

  // === CONTENT AREA ===
  content: {
    paddingHorizontal: 40,
    paddingTop: 20,
    paddingBottom: 90,
  },

  // === HEADER ===
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImage: {
    width: 44,
    height: 44,
    objectFit: "contain",
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 15,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  receiptTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  receiptNumber: {
    fontSize: 9,
    color: GRAY,
    marginTop: 3,
    textAlign: "right",
  },

  // === DIVIDER ===
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 14,
  },

  // === RECEBEMOS DE BOX ===
  recebemosBox: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  recebemosRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  recebemosRowLast: {
    borderBottomWidth: 0,
  },
  recebemosLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    width: 110,
  },
  recebemosValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    flex: 1,
  },
  recebemosValueNormal: {
    fontSize: 10,
    color: DARK,
    flex: 1,
  },
  recebemosValueAccent: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    flex: 1,
  },

  // === TABLE ===
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  descCol: {
    flex: 3,
  },
  valCol: {
    flex: 1,
    textAlign: "right",
  },
  rowText: {
    fontSize: 10,
    color: DARK,
  },
  rowValue: {
    fontSize: 10,
    color: DARK,
  },
  totalRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: LIGHT_GRAY,
  },
  totalLabel: {
    flex: 3,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
  },
  totalValue: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: ACCENT,
    textAlign: "right",
  },

  // === PIX PAYMENT SECTION ===
  pixSection: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 14,
  },
  pixLeft: {
    flex: 1,
    padding: 12,
  },
  pixTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 8,
  },
  pixStep: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 3,
    lineHeight: 1.3,
  },
  pixKeyBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
  },
  pixKeyLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  pixKeyValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  pixBeneficiário: {
    fontSize: 9,
    color: GRAY,
    marginTop: 6,
  },
  pixRight: {
    width: 140,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  qrImage: {
    width: 95,
    height: 95,
  },
  qrLabel: {
    fontSize: 8,
    color: GRAY,
    marginTop: 8,
    textAlign: "center",
  },
  qrAmount: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginTop: 2,
    textAlign: "center",
  },

  // === DETAILS / OBSERVATIONS ===
  detailsBox: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 14,
  },
  detailsTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 9,
    color: DARK,
    lineHeight: 1.5,
  },

  // === VALOR POR EXTENSO ===
  valorExtensoBox: {
    borderWidth: 1,
    borderColor: BORDER,
    padding: 10,
    marginBottom: 14,
    backgroundColor: LIGHT_GRAY,
  },
  valorExtensoText: {
    fontSize: 10,
    color: DARK,
  },
  valorExtensoBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },

  // === SIGNATURE ===
  signatureArea: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 0,
  },
  signatureLocal: {
    fontSize: 9,
    color: DARK,
    marginBottom: 30,
  },
  signatureLine: {
    width: 260,
    borderTopWidth: 1,
    borderTopColor: DARK,
    marginBottom: 6,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textAlign: "center",
  },
  signatureRole: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
    textAlign: "center",
  },

  // === FOOTER ===
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: "#ffffff",
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  footerCol: {
    flexDirection: "column",
    gap: 3,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 8,
    color: DARK,
  },
  footerDivider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 4,
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "center",
  },
  footerCompany: {
    fontSize: 7,
    color: GRAY,
    letterSpacing: 0.3,
    textAlign: "center",
  },
});

interface PixInfo {
  chave: string;
  nomeBeneficiario: string;
  tipo: string;
}

interface ReciboPDFProps {
  recibo: {
    id: string;
    mesReferencia: Date;
    honorario: number;
    decimoTerceiro: number;
    registro: number;
    alteracao: number;
    materialExpediente: number;
    outros: number;
    total: number;
    detalhamento: string | null;
    createdAt: Date;
    cliente?: {
      nome: string;
      cnpj: string;
      email: string | null;
      responsavel: string | null;
    } | null;
    avulsoNome?: string | null;
    avulsoCnpj?: string | null;
  };
  logoSrc?: string | null;
  qrCodeSrc?: string | null;
  pixInfo?: PixInfo | null;
  whatsappIconSrc?: string | null;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDocument(doc: string): { label: string; formatted: string } {
  const digits = doc.replace(/\D/g, "");
  if (digits.length <= 11) {
    const f = digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
    return { label: "CPF", formatted: f };
  }
  const f = digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return { label: "CNPJ", formatted: f };
}

function formatMonthYear(date: Date): string {
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const d = new Date(date);
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function pixKeyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cpf: "CPF",
    cnpj: "CNPJ",
    email: "E-MAIL",
    phone: "TELEFONE",
    random: "CHAVE ALEATÓRIA",
  };
  return labels[type] || type.toUpperCase();
}

function formatDateBR(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function ReciboPDF({ recibo, logoSrc, qrCodeSrc, pixInfo, whatsappIconSrc }: ReciboPDFProps) {
  const items = [
    { description: "Honorários Contábeis", value: Number(recibo.honorario) },
    { description: "13º Salário", value: Number(recibo.decimoTerceiro) },
    { description: "Taxa de Registro", value: Number(recibo.registro) },
    { description: "Alteração Contratual", value: Number(recibo.alteracao) },
    { description: "Material de Expediente", value: Number(recibo.materialExpediente) },
    { description: "Outros Servicos", value: Number(recibo.outros) },
  ].filter((item) => item.value > 0);

  const clienteNome = recibo.cliente?.nome || recibo.avulsoNome || "Avulso";
  const clienteCnpj = recibo.cliente?.cnpj || recibo.avulsoCnpj || "";
  const docInfo = formatDocument(clienteCnpj);
  const totalFormatted = formatCurrency(Number(recibo.total));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Thin top line */}
        <View style={styles.topLine} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {logoSrc && <Image style={styles.logoImage} src={logoSrc} />}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>J AMARAL CONTABIL</Text>
                <Text style={styles.companySubtitle}>Gestão Fiscal e Contábil</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.receiptTitle}>Recibo de Prestação de Serviços</Text>
              <Text style={styles.receiptNumber}>
                Nº {recibo.id.slice(-6).toUpperCase()} — Emitido em {new Date(recibo.createdAt).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* RECEBEMOS DE box */}
          <View style={styles.recebemosBox}>
            <View style={styles.recebemosRow}>
              <Text style={styles.recebemosLabel}>RECEBEMOS DE:</Text>
              <Text style={styles.recebemosValue}>{clienteNome}</Text>
            </View>
            <View style={styles.recebemosRow}>
              <Text style={styles.recebemosLabel}>{docInfo.label}:</Text>
              <Text style={styles.recebemosValueNormal}>{docInfo.formatted}</Text>
            </View>
            {recibo.cliente?.responsavel && (
              <View style={styles.recebemosRow}>
                <Text style={styles.recebemosLabel}>RESPONSÁVEL:</Text>
                <Text style={styles.recebemosValueNormal}>{recibo.cliente.responsavel}</Text>
              </View>
            )}
            <View style={styles.recebemosRow}>
              <Text style={styles.recebemosLabel}>REFERENTE A:</Text>
              <Text style={styles.recebemosValueNormal}>{formatMonthYear(recibo.mesReferencia)}</Text>
            </View>
            <View style={[styles.recebemosRow, styles.recebemosRowLast]}>
              <Text style={styles.recebemosLabel}>A IMPORTÂNCIA DE:</Text>
              <Text style={styles.recebemosValueAccent}>{totalFormatted}</Text>
            </View>
          </View>

          {/* Services Table */}
          <Text style={styles.sectionLabel}>Discriminação dos Serviços</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.descCol]}>Descrição</Text>
              <Text style={[styles.tableHeaderText, styles.valCol]}>Valor</Text>
            </View>
            {items.map((item, index) => (
              <View
                key={item.description}
                style={[
                  styles.tableRow,
                  index === items.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <Text style={[styles.rowText, styles.descCol]}>{item.description}</Text>
                <Text style={[styles.rowValue, styles.valCol]}>
                  {formatCurrency(item.value)}
                </Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.descCol]}>TOTAL</Text>
              <Text style={[styles.totalValue, styles.valCol]}>
                {totalFormatted}
              </Text>
            </View>
          </View>

          {/* PIX Payment */}
          {pixInfo && (
            <View style={styles.pixSection}>
              <View style={styles.pixLeft}>
                <Text style={styles.pixTitle}>Pagamento via PIX</Text>
                {qrCodeSrc ? (
                  <>
                    <Text style={styles.pixStep}>1. Abra o app do seu banco</Text>
                    <Text style={styles.pixStep}>2. Escaneie o QR Code ao lado</Text>
                    <Text style={styles.pixStep}>
                      3. Confirme o pagamento de {totalFormatted}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.pixStep}>1. Abra o app do seu banco</Text>
                    <Text style={styles.pixStep}>2. Escolha pagar com PIX usando a chave abaixo</Text>
                    <Text style={styles.pixStep}>
                      3. Digite o valor: {totalFormatted}
                    </Text>
                    <Text style={styles.pixStep}>4. Confirme o pagamento</Text>
                  </>
                )}
                <View style={styles.pixKeyBox}>
                  <Text style={styles.pixKeyLabel}>
                    Chave PIX ({pixKeyTypeLabel(pixInfo.tipo)})
                  </Text>
                  <Text style={styles.pixKeyValue}>{pixInfo.chave}</Text>
                  <Text style={styles.pixBeneficiário}>
                    Beneficiário: {pixInfo.nomeBeneficiario}
                  </Text>
                </View>
              </View>
              {qrCodeSrc && (
                <View style={styles.pixRight}>
                  <Image style={styles.qrImage} src={qrCodeSrc} />
                  <Text style={styles.qrLabel}>Escaneie para pagar</Text>
                  <Text style={styles.qrAmount}>
                    {totalFormatted}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Observations */}
          {recibo.detalhamento && (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsTitle}>Observações</Text>
              <Text style={styles.detailsText}>{recibo.detalhamento}</Text>
            </View>
          )}

          {/* Valor por extenso */}
          <View style={styles.valorExtensoBox}>
            <Text style={styles.valorExtensoText}>
              Importância recebida:{" "}
              <Text style={styles.valorExtensoBold}>{totalFormatted}</Text>
              {" "}referente à prestação de serviços contábeis de{" "}
              <Text style={styles.valorExtensoBold}>{formatMonthYear(recibo.mesReferencia)}</Text>.
            </Text>
          </View>

          {/* Signature */}
          <View style={styles.signatureArea}>
            <Text style={styles.signatureLocal}>
              Local e Data: Cariacica/ES, {formatDateBR(recibo.createdAt)}
            </Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>Jean Claude Rezende do Amaral</Text>
            <Text style={styles.signatureRole}>Contador - CRC-ES 008870/O-5</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={styles.footerCol}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Tel: </Text>
                <Text style={styles.footerValue}>(27) 3336-3213</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Cel: </Text>
                <Text style={styles.footerValue}>(27) 99932-6612</Text>
              </View>
            </View>
            <View style={styles.footerCol}>
              <View style={styles.footerItem}>
                {whatsappIconSrc && <Image src={whatsappIconSrc} style={{ width: 10, height: 10 }} />}
                <Text style={styles.footerValue}>(27) 99524-6812</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>E-mail: </Text>
                <Text style={styles.footerValue}>adm@jamaralcontabil.com.br</Text>
              </View>
            </View>
            <View style={styles.footerCol}>
              <View style={styles.footerItem}>
                <Text style={styles.footerLabel}>Endereço: </Text>
                <Text style={styles.footerValue}>Rua Adley, 108, Morada de Santa Fé</Text>
              </View>
              <View style={styles.footerItem}>
                <Text style={styles.footerValue}>Cariacica/ES - CEP 29.143-719</Text>
              </View>
            </View>
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerBottom}>
            <Text style={styles.footerCompany}>
              Jean Claude Rezende do Amaral - Contador - CRC-ES 008870/O-5 - Documento gerado eletronicamente
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
