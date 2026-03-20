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
const LIGHT_GRAY = "#f9fafb";
const BORDER = "#e5e7eb";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: DARK,
    backgroundColor: "#ffffff",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImage: {
    width: 40,
    height: 40,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  companySubtitle: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  reportTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    marginBottom: 3,
  },
  reportPeriod: {
    fontSize: 10,
    color: GRAY,
  },
  reportDate: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },

  // Summary cards
  summaryRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: LIGHT_GRAY,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 12,
  },
  summaryLabel: {
    fontSize: 8,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  summarySubtext: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },

  // Section
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: DARK,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },

  // Table
  table: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: LIGHT_GRAY,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableHeaderText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: LIGHT_GRAY,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  cellText: {
    fontSize: 9,
    color: DARK,
  },
  cellTextBold: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  cellTextGray: {
    fontSize: 8,
    color: GRAY,
  },

  // Column widths
  colCliente: { flex: 3 },
  colDoc: { flex: 2 },
  colHonorario: { flex: 1.2, textAlign: "right" },
  colOutros: { flex: 1.2, textAlign: "right" },
  colTotal: { flex: 1.2, textAlign: "right" },
  colStatus: { flex: 1, textAlign: "center" },

  // Totals row
  totalsRow: {
    flexDirection: "row",
    backgroundColor: DARK,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  totalsText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
  },

  // Status breakdown
  statusSection: {
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: "row",
    gap: 12,
  },
  statusCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 4,
    padding: 10,
  },
  statusLabel: {
    fontSize: 8,
    color: GRAY,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  statusValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: DARK,
  },
  statusCount: {
    fontSize: 8,
    color: GRAY,
    marginTop: 2,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: GRAY,
  },
  pageNumber: {
    fontSize: 7,
    color: GRAY,
  },
});

interface ReciboItem {
  id: string;
  clienteNome: string;
  clienteCnpj: string;
  honorario: number;
  decimoTerceiro: number;
  registro: number;
  alteracao: number;
  materialExpediente: number;
  outros: number;
  total: number;
  status: string;
}

interface RelatorioMensalPDFProps {
  mes: string; // "Janeiro 2026"
  recibos: ReciboItem[];
  totalGeral: number;
  totalPagos: number;
  totalPendentes: number;
  totalCancelados: number;
  countPagos: number;
  countPendentes: number;
  countCancelados: number;
  logoSrc?: string | null;
}

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDocument(doc: string): string {
  const digits = doc.replace(/\D/g, "");
  if (digits.length <= 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  }
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function statusLabel(status: string): string {
  if (status === "pago") return "Pago";
  if (status === "cancelado") return "Cancelado";
  return "Pendente";
}

export default function RelatorioMensalPDF({
  mes,
  recibos,
  totalGeral,
  totalPagos,
  totalPendentes,
  totalCancelados,
  countPagos,
  countPendentes,
  countCancelados,
  logoSrc,
}: RelatorioMensalPDFProps) {
  const today = new Date().toLocaleDateString("pt-BR");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoSrc && <Image style={styles.logoImage} src={logoSrc} />}
            <View>
              <Text style={styles.companyName}>J AMARAL CONTABIL</Text>
              <Text style={styles.companySubtitle}>Gestão Fiscal e Contábil</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>Relatório Mensal</Text>
            <Text style={styles.reportPeriod}>{mes}</Text>
            <Text style={styles.reportDate}>Gerado em {today}</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total de Recibos</Text>
            <Text style={styles.summaryValue}>{recibos.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Faturamento Total</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalGeral)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Recebido</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPagos)}</Text>
            <Text style={styles.summarySubtext}>{countPagos} recibos pagos</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>A Receber</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalPendentes)}</Text>
            <Text style={styles.summarySubtext}>{countPendentes} pendentes</Text>
          </View>
        </View>

        {/* Recibos Table */}
        <Text style={styles.sectionTitle}>Detalhamento por Cliente</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.colCliente]}>Cliente</Text>
            <Text style={[styles.tableHeaderText, styles.colDoc]}>CPF/CNPJ</Text>
            <Text style={[styles.tableHeaderText, styles.colHonorario]}>Honorários</Text>
            <Text style={[styles.tableHeaderText, styles.colOutros]}>Outros</Text>
            <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
            <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
          </View>

          {recibos.map((recibo, index) => {
            const outrosTotal =
              recibo.decimoTerceiro +
              recibo.registro +
              recibo.alteracao +
              recibo.materialExpediente +
              recibo.outros;

            return (
              <View
                key={recibo.id}
                style={[
                  styles.tableRow,
                  index % 2 === 1 ? styles.tableRowAlt : {},
                  index === recibos.length - 1 ? styles.tableRowLast : {},
                ]}
              >
                <Text style={[styles.cellTextBold, styles.colCliente]}>{recibo.clienteNome}</Text>
                <Text style={[styles.cellTextGray, styles.colDoc]}>{formatDocument(recibo.clienteCnpj)}</Text>
                <Text style={[styles.cellText, styles.colHonorario]}>{formatCurrency(recibo.honorario)}</Text>
                <Text style={[styles.cellText, styles.colOutros]}>{formatCurrency(outrosTotal)}</Text>
                <Text style={[styles.cellTextBold, styles.colTotal]}>{formatCurrency(recibo.total)}</Text>
                <Text style={[styles.cellText, styles.colStatus]}>{statusLabel(recibo.status)}</Text>
              </View>
            );
          })}

          {/* Totals Row */}
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsText, styles.colCliente]}>TOTAL GERAL</Text>
            <Text style={[styles.totalsText, styles.colDoc]}>{recibos.length} recibos</Text>
            <Text style={[styles.totalsText, styles.colHonorario]}>
              {formatCurrency(recibos.reduce((s, r) => s + r.honorario, 0))}
            </Text>
            <Text style={[styles.totalsText, styles.colOutros]}>
              {formatCurrency(
                recibos.reduce(
                  (s, r) => s + r.decimoTerceiro + r.registro + r.alteracao + r.materialExpediente + r.outros,
                  0
                )
              )}
            </Text>
            <Text style={[styles.totalsText, styles.colTotal]}>{formatCurrency(totalGeral)}</Text>
            <Text style={[styles.totalsText, styles.colStatus]}></Text>
          </View>
        </View>

        {/* Status Breakdown */}
        <Text style={styles.sectionTitle}>Resumo por Status</Text>
        <View style={styles.statusSection}>
          <View style={styles.statusRow}>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Pagos</Text>
              <Text style={styles.statusValue}>{formatCurrency(totalPagos)}</Text>
              <Text style={styles.statusCount}>{countPagos} recibos</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Pendentes</Text>
              <Text style={styles.statusValue}>{formatCurrency(totalPendentes)}</Text>
              <Text style={styles.statusCount}>{countPendentes} recibos</Text>
            </View>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Cancelados</Text>
              <Text style={styles.statusValue}>{formatCurrency(totalCancelados)}</Text>
              <Text style={styles.statusCount}>{countCancelados} recibos</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            J AMARAL CONTABIL — Jean Claude Rezende do Amaral — CRC-ES 008870/O-5
          </Text>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
