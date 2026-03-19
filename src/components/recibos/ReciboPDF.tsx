import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const BLUE = "#2E3192";
const CYAN = "#00AEEF";
const DARK = "#1a1a2e";
const GRAY = "#6b7280";
const LIGHT_GRAY = "#f3f4f6";
const BORDER = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
    backgroundColor: "#ffffff",
  },

  // === TOP ACCENT BAR ===
  accentBar: {
    height: 6,
    backgroundColor: CYAN,
  },

  // === CONTENT AREA ===
  content: {
    paddingHorizontal: 44,
    paddingTop: 28,
    paddingBottom: 120,
  },

  // === HEADER ===
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoImage: {
    width: 52,
    height: 52,
    objectFit: "contain",
  },
  companyInfo: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    letterSpacing: 0.5,
  },
  companySubtitle: {
    fontSize: 9,
    color: GRAY,
    marginTop: 3,
    letterSpacing: 0.3,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  receiptBadge: {
    backgroundColor: BLUE,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    marginBottom: 6,
  },
  receiptBadgeText: {
    color: "#ffffff",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
  },
  receiptDate: {
    fontSize: 9,
    color: GRAY,
    textAlign: "right",
  },

  // === DIVIDER ===
  divider: {
    height: 1,
    backgroundColor: BORDER,
    marginBottom: 22,
  },

  // === REFERENCE + CLIENT ROW ===
  infoRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  referenceBox: {
    width: 170,
    backgroundColor: BLUE,
    borderRadius: 6,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  referenceLabel: {
    fontSize: 8,
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  referenceMonth: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  clientBox: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 6,
    padding: 16,
  },
  clientLabel: {
    fontSize: 8,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  clientName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 4,
  },
  clientDetail: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 2,
  },

  // === TABLE ===
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontFamily: "Helvetica-Bold",
  },
  totalBar: {
    flexDirection: "row",
    backgroundColor: CYAN,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  totalLabel: {
    flex: 3,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },
  totalValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    textAlign: "right",
  },

  // === PIX PAYMENT SECTION ===
  pixSection: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 24,
  },
  pixLeft: {
    flex: 1,
    padding: 18,
  },
  pixTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
    marginBottom: 12,
  },
  pixStep: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 4,
    lineHeight: 1.4,
  },
  pixKeyBox: {
    marginTop: 12,
    backgroundColor: LIGHT_GRAY,
    borderRadius: 4,
    padding: 10,
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
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BLUE,
  },
  pixBeneficiario: {
    fontSize: 9,
    color: GRAY,
    marginTop: 6,
  },
  pixRight: {
    width: 155,
    backgroundColor: LIGHT_GRAY,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderLeftWidth: 1,
    borderLeftColor: BORDER,
  },
  qrImage: {
    width: 110,
    height: 110,
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
    color: BLUE,
    marginTop: 2,
    textAlign: "center",
  },

  // === DETAILS / OBSERVATIONS ===
  detailsBox: {
    backgroundColor: "#fffbeb",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
    padding: 14,
    marginBottom: 24,
  },
  detailsTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 9,
    color: "#78350f",
    lineHeight: 1.5,
  },

  // === SIGNATURE ===
  signatureArea: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  signatureLine: {
    width: 220,
    borderTopWidth: 1,
    borderTopColor: DARK,
    marginBottom: 6,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  signatureRole: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },

  // === FOOTER ===
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 44,
    paddingVertical: 18,
    backgroundColor: LIGHT_GRAY,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
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
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  footerCompany: {
    fontSize: 7,
    color: GRAY,
    letterSpacing: 0.3,
  },
});

interface ContactInfo {
  endereco?: string | null;
  telefone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
}

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
    cliente: {
      nome: string;
      cnpj: string;
      email: string | null;
      responsavel: string | null;
    };
  };
  logoSrc?: string | null;
  qrCodeSrc?: string | null;
  pixInfo?: PixInfo | null;
  contactInfo?: ContactInfo | null;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCNPJ(cnpj: string): string {
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function formatMonthYear(date: Date): string {
  const months = [
    "Janeiro", "Fevereiro", "Marco", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

function pixKeyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    cpf: "CPF",
    cnpj: "CNPJ",
    email: "E-MAIL",
    phone: "TELEFONE",
    random: "CHAVE ALEATORIA",
  };
  return labels[type] || type.toUpperCase();
}

export default function ReciboPDF({ recibo, logoSrc, qrCodeSrc, pixInfo, contactInfo }: ReciboPDFProps) {
  const items = [
    { description: "Honorarios Contabeis", value: Number(recibo.honorario) },
    { description: "13o Salario", value: Number(recibo.decimoTerceiro) },
    { description: "Taxa de Registro", value: Number(recibo.registro) },
    { description: "Alteracao Contratual", value: Number(recibo.alteracao) },
    { description: "Material de Expediente", value: Number(recibo.materialExpediente) },
    { description: "Outros Servicos", value: Number(recibo.outros) },
  ].filter((item) => item.value > 0);

  const hasContact = contactInfo && (
    contactInfo.endereco || contactInfo.telefone || contactInfo.whatsapp || contactInfo.email
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Top accent bar */}
        <View style={styles.accentBar} />

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {logoSrc && <Image style={styles.logoImage} src={logoSrc} />}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>JC Contabilidade</Text>
                <Text style={styles.companySubtitle}>Gestao Fiscal e Contabil</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <View style={styles.receiptBadge}>
                <Text style={styles.receiptBadgeText}>
                  RECIBO #{recibo.id.slice(-6).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.receiptDate}>
                Emitido em {new Date(recibo.createdAt).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Reference + Client */}
          <View style={styles.infoRow}>
            <View style={styles.referenceBox}>
              <Text style={styles.referenceLabel}>Referente a</Text>
              <Text style={styles.referenceMonth}>
                {formatMonthYear(recibo.mesReferencia)}
              </Text>
            </View>
            <View style={styles.clientBox}>
              <Text style={styles.clientLabel}>Dados do Cliente</Text>
              <Text style={styles.clientName}>{recibo.cliente.nome}</Text>
              <Text style={styles.clientDetail}>
                CNPJ: {formatCNPJ(recibo.cliente.cnpj)}
              </Text>
              {recibo.cliente.responsavel && (
                <Text style={styles.clientDetail}>
                  Responsavel: {recibo.cliente.responsavel}
                </Text>
              )}
              {recibo.cliente.email && (
                <Text style={styles.clientDetail}>
                  E-mail: {recibo.cliente.email}
                </Text>
              )}
            </View>
          </View>

          {/* Services Table */}
          <Text style={styles.sectionLabel}>Discriminacao dos Servicos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.descCol]}>Descricao</Text>
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
            <View style={styles.totalBar}>
              <Text style={styles.totalLabel}>TOTAL</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(Number(recibo.total))}
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
                      3. Confirme o pagamento de {formatCurrency(Number(recibo.total))}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.pixStep}>1. Abra o app do seu banco</Text>
                    <Text style={styles.pixStep}>2. Escolha pagar com PIX usando a chave abaixo</Text>
                    <Text style={styles.pixStep}>
                      3. Digite o valor: {formatCurrency(Number(recibo.total))}
                    </Text>
                    <Text style={styles.pixStep}>4. Confirme o pagamento</Text>
                  </>
                )}
                <View style={styles.pixKeyBox}>
                  <Text style={styles.pixKeyLabel}>
                    Chave PIX ({pixKeyTypeLabel(pixInfo.tipo)})
                  </Text>
                  <Text style={styles.pixKeyValue}>{pixInfo.chave}</Text>
                  <Text style={styles.pixBeneficiario}>
                    Beneficiario: {pixInfo.nomeBeneficiario}
                  </Text>
                </View>
              </View>
              {qrCodeSrc && (
                <View style={styles.pixRight}>
                  <Image style={styles.qrImage} src={qrCodeSrc} />
                  <Text style={styles.qrLabel}>Escaneie para pagar</Text>
                  <Text style={styles.qrAmount}>
                    {formatCurrency(Number(recibo.total))}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Observations */}
          {recibo.detalhamento && (
            <View style={styles.detailsBox}>
              <Text style={styles.detailsTitle}>Observacoes</Text>
              <Text style={styles.detailsText}>{recibo.detalhamento}</Text>
            </View>
          )}

          {/* Signature */}
          <View style={styles.signatureArea}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>JC Contabilidade</Text>
            <Text style={styles.signatureRole}>Responsavel Tecnico</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {hasContact && (
            <View style={styles.footerRow}>
              {contactInfo?.endereco && (
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Endereco: </Text>
                  <Text style={styles.footerValue}>{contactInfo.endereco}</Text>
                </View>
              )}
              {contactInfo?.telefone && (
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>Tel: </Text>
                  <Text style={styles.footerValue}>{contactInfo.telefone}</Text>
                </View>
              )}
              {contactInfo?.whatsapp && (
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>WhatsApp: </Text>
                  <Text style={styles.footerValue}>{contactInfo.whatsapp}</Text>
                </View>
              )}
              {contactInfo?.email && (
                <View style={styles.footerItem}>
                  <Text style={styles.footerLabel}>E-mail: </Text>
                  <Text style={styles.footerValue}>{contactInfo.email}</Text>
                </View>
              )}
            </View>
          )}
          <View style={styles.footerBottom}>
            <Text style={styles.footerCompany}>
              JC Contabilidade - Gestao Fiscal e Contabil
            </Text>
            <Text style={styles.footerCompany}>
              Documento gerado eletronicamente
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
