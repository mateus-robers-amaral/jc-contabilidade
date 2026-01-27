import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#00AEEF",
  },
  logo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImage: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  logoText: {
    flexDirection: "column",
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: "#2E3192",
  },
  companySubtitle: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  receiptInfo: {
    textAlign: "right",
  },
  receiptNumber: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: "#2E3192",
  },
  receiptDate: {
    fontSize: 10,
    color: "#666",
    marginTop: 4,
  },
  // Highlighted Reference Month Section
  referenceHighlight: {
    backgroundColor: "#E6F7FD",
    padding: 15,
    marginBottom: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#00AEEF",
    alignItems: "center",
  },
  referenceLabel: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  referenceMonth: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#2E3192",
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#2E3192",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  clientInfo: {
    backgroundColor: "#f0f7ff",
    padding: 15,
    borderRadius: 4,
  },
  clientName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  clientDetail: {
    fontSize: 10,
    color: "#666",
    marginBottom: 3,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#2E3192",
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  tableHeaderText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    padding: 10,
  },
  tableRowAlt: {
    backgroundColor: "#f0f7ff",
  },
  descriptionCol: {
    flex: 3,
  },
  valueCol: {
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#00AEEF",
    padding: 12,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  totalText: {
    flex: 3,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    fontSize: 12,
  },
  totalValue: {
    flex: 1,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    fontSize: 14,
  },
  // Payment Section with QR Code
  paymentSection: {
    marginTop: 20,
    flexDirection: "row",
    gap: 20,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#2E3192",
    marginBottom: 10,
  },
  paymentText: {
    fontSize: 10,
    color: "#666",
    marginBottom: 4,
  },
  qrCodeContainer: {
    alignItems: "center",
    padding: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  qrCodeImage: {
    width: 120,
    height: 120,
  },
  qrCodeLabel: {
    fontSize: 9,
    color: "#666",
    marginTop: 6,
    textAlign: "center",
  },
  // Footer with contact info
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  footerColumn: {
    flex: 1,
  },
  footerLabel: {
    fontSize: 8,
    color: "#999",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  footerText: {
    fontSize: 9,
    color: "#666",
  },
  footerDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  footerBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerCompany: {
    fontSize: 9,
    color: "#999",
  },
  signatureSection: {
    marginTop: 30,
    paddingTop: 20,
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#333",
    width: 200,
    marginTop: 30,
    marginBottom: 5,
  },
  signatureText: {
    fontSize: 10,
    color: "#666",
  },
  detailsSection: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#fff9e6",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: "#f0c000",
  },
  detailsTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 10,
    color: "#666",
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
  return `${months[d.getMonth()]} de ${d.getFullYear()}`;
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

  const hasContactInfo = contactInfo && (
    contactInfo.endereco || contactInfo.telefone || contactInfo.whatsapp || contactInfo.email
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logo}>
            {logoSrc && <Image style={styles.logoImage} src={logoSrc} />}
            <View style={styles.logoText}>
              <Text style={styles.companyName}>JC Contabilidade</Text>
              <Text style={styles.companySubtitle}>Gestao Fiscal e Contabil</Text>
            </View>
          </View>
          <View style={styles.receiptInfo}>
            <Text style={styles.receiptNumber}>
              Recibo #{recibo.id.slice(-6).toUpperCase()}
            </Text>
            <Text style={styles.receiptDate}>
              Emissao: {new Date(recibo.createdAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>

        {/* Highlighted Reference Month */}
        <View style={styles.referenceHighlight}>
          <Text style={styles.referenceLabel}>Referente a</Text>
          <Text style={styles.referenceMonth}>
            {formatMonthYear(recibo.mesReferencia)}
          </Text>
        </View>

        {/* Client Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{recibo.cliente.nome}</Text>
            <Text style={styles.clientDetail}>
              CNPJ: {formatCNPJ(recibo.cliente.cnpj)}
            </Text>
            {recibo.cliente.email && (
              <Text style={styles.clientDetail}>
                E-mail: {recibo.cliente.email}
              </Text>
            )}
            {recibo.cliente.responsavel && (
              <Text style={styles.clientDetail}>
                Responsavel: {recibo.cliente.responsavel}
              </Text>
            )}
          </View>
        </View>

        {/* Values Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Discriminacao dos Servicos</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.descriptionCol]}>
                Descricao
              </Text>
              <Text style={[styles.tableHeaderText, styles.valueCol]}>
                Valor
              </Text>
            </View>
            {items.map((item, index) => (
              <View
                key={item.description}
                style={
                  index % 2 === 1
                    ? [styles.tableRow, styles.tableRowAlt]
                    : styles.tableRow
                }
              >
                <Text style={styles.descriptionCol}>{item.description}</Text>
                <Text style={styles.valueCol}>{formatCurrency(item.value)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.totalText}>TOTAL</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(Number(recibo.total))}
              </Text>
            </View>
          </View>
        </View>

        {/* Payment Section with PIX Key */}
        {pixInfo && (
          <View style={styles.paymentSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.paymentTitle}>Pagamento via PIX</Text>
              <Text style={styles.paymentText}>
                1. Abra o app do seu banco
              </Text>
              <Text style={styles.paymentText}>
                2. Escolha pagar com PIX usando a chave abaixo
              </Text>
              <Text style={styles.paymentText}>
                3. Digite o valor: {formatCurrency(Number(recibo.total))}
              </Text>
              <Text style={styles.paymentText}>
                4. Confirme o pagamento
              </Text>
              <View style={{ marginTop: 15, padding: 12, backgroundColor: "#f0f7ff", borderRadius: 6, borderWidth: 1, borderColor: "#00AEEF" }}>
                <Text style={{ fontSize: 9, color: "#666", marginBottom: 4 }}>CHAVE PIX (CNPJ):</Text>
                <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold", color: "#2E3192" }}>{pixInfo.chave}</Text>
                <Text style={{ fontSize: 9, color: "#666", marginTop: 6 }}>BENEFICIARIO:</Text>
                <Text style={{ fontSize: 11, color: "#333" }}>{pixInfo.nomeBeneficiario}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Details */}
        {recibo.detalhamento && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsTitle}>Observacoes</Text>
            <Text style={styles.detailsText}>{recibo.detalhamento}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>JC Contabilidade</Text>
          <Text style={styles.signatureText}>Responsavel Tecnico</Text>
        </View>

        {/* Footer with Contact Info */}
        <View style={styles.footer}>
          {hasContactInfo && (
            <>
              <View style={styles.footerContent}>
                {contactInfo?.endereco && (
                  <View style={styles.footerColumn}>
                    <Text style={styles.footerLabel}>Endereco</Text>
                    <Text style={styles.footerText}>{contactInfo.endereco}</Text>
                  </View>
                )}
              </View>
              <View style={styles.footerContent}>
                {contactInfo?.telefone && (
                  <View style={styles.footerColumn}>
                    <Text style={styles.footerLabel}>Telefone</Text>
                    <Text style={styles.footerText}>{contactInfo.telefone}</Text>
                  </View>
                )}
                {contactInfo?.whatsapp && (
                  <View style={styles.footerColumn}>
                    <Text style={styles.footerLabel}>WhatsApp</Text>
                    <Text style={styles.footerText}>{contactInfo.whatsapp}</Text>
                  </View>
                )}
                {contactInfo?.email && (
                  <View style={styles.footerColumn}>
                    <Text style={styles.footerLabel}>E-mail</Text>
                    <Text style={styles.footerText}>{contactInfo.email}</Text>
                  </View>
                )}
              </View>
              <View style={styles.footerDivider} />
            </>
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
