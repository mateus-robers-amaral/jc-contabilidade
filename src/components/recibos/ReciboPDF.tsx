import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const DARK = "#1a1a2e";
const GRAY = "#6b7280";
const LIGHT = "#f8f9fa";
const BORDER = "#e2e5ea";
const ACCENT = "#2E3192";
const BLUE = "#00AEEF";

const s = StyleSheet.create({
  page: { padding: 0, fontFamily: "Helvetica", fontSize: 10, color: DARK, backgroundColor: "#fff" },

  /* ── Accent bar ── */
  accentBar: { height: 4, backgroundColor: ACCENT },

  /* ── Content ── */
  content: { paddingHorizontal: 44, paddingTop: 20, paddingBottom: 80 },

  /* ── Header ── */
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 42, height: 42, objectFit: "contain" },
  companyName: { fontSize: 14, fontFamily: "Helvetica-Bold", color: ACCENT, letterSpacing: 0.3 },
  companySub: { fontSize: 7.5, color: GRAY, marginTop: 1, letterSpacing: 0.4, textTransform: "uppercase" },
  headerRight: { alignItems: "flex-end" },
  docTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK, letterSpacing: 0.3 },
  docMeta: { fontSize: 8, color: GRAY, marginTop: 3, textAlign: "right" },

  /* ── Divider ── */
  hr: { height: 1, backgroundColor: BORDER, marginVertical: 10 },

  /* ── Client card ── */
  clientCard: { backgroundColor: LIGHT, borderRadius: 4, padding: 12, marginBottom: 12 },
  clientTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  clientRow: { flexDirection: "row", marginBottom: 4 },
  clientLabel: { fontSize: 8.5, color: GRAY, width: 95 },
  clientValue: { fontSize: 9.5, color: DARK, flex: 1 },
  clientValueBold: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK, flex: 1 },

  /* ── Reference bar ── */
  refBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: ACCENT, borderRadius: 4, padding: 10, marginBottom: 12 },
  refLabel: { fontSize: 8, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.8 },
  refValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#fff", marginTop: 1 },

  /* ── Table ── */
  tableLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: DARK, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 },
  table: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  tHead: { flexDirection: "row", backgroundColor: LIGHT, paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  tHeadText: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 0.6 },
  tRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: BORDER },
  tRowLast: { borderBottomWidth: 0 },
  tRowAlt: { backgroundColor: "#fafbfc" },
  descCol: { flex: 3 },
  valCol: { flex: 1, textAlign: "right" },
  cellText: { fontSize: 9.5, color: DARK },
  cellValue: { fontSize: 9.5, color: DARK },
  tTotal: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 14, backgroundColor: ACCENT },
  tTotalLabel: { flex: 3, fontSize: 9.5, fontFamily: "Helvetica-Bold", color: "#fff", textTransform: "uppercase", letterSpacing: 0.5 },
  tTotalValue: { flex: 1, fontSize: 11, fontFamily: "Helvetica-Bold", color: "#fff", textAlign: "right" },

  /* ── Observações ── */
  obsBox: { borderWidth: 1, borderColor: BORDER, borderRadius: 4, padding: 10, marginBottom: 12 },
  obsTitle: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  obsText: { fontSize: 9, color: DARK, lineHeight: 1.5 },

  /* ── PIX ── */
  pixBox: { flexDirection: "row", borderWidth: 1, borderColor: BORDER, borderRadius: 4, overflow: "hidden", marginBottom: 12 },
  pixLeft: { flex: 1, padding: 12 },
  pixTitle: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: DARK, marginBottom: 8 },
  pixStep: { fontSize: 8, color: GRAY, marginBottom: 2.5, lineHeight: 1.3 },
  pixKeyCard: { marginTop: 8, backgroundColor: LIGHT, borderRadius: 3, padding: 10 },
  pixKeyType: { fontSize: 7, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  pixKeyVal: { fontSize: 10.5, fontFamily: "Helvetica-Bold", color: DARK },
  pixBenef: { fontSize: 8, color: GRAY, marginTop: 4 },
  pixRight: { width: 135, alignItems: "center", justifyContent: "center", padding: 12, borderLeftWidth: 1, borderLeftColor: BORDER, backgroundColor: LIGHT },
  qr: { width: 90, height: 90 },
  qrCaption: { fontSize: 7.5, color: GRAY, marginTop: 6, textAlign: "center" },
  qrAmount: { fontSize: 10, fontFamily: "Helvetica-Bold", color: ACCENT, marginTop: 2, textAlign: "center" },

  /* ── Assinatura ── */
  sigArea: { alignItems: "center", marginTop: 16 },
  sigLocal: { fontSize: 8.5, color: GRAY, marginBottom: 24 },
  sigLine: { width: 240, borderTopWidth: 1, borderTopColor: DARK, marginBottom: 6 },
  sigName: { fontSize: 9.5, fontFamily: "Helvetica-Bold", color: DARK, textAlign: "center" },
  sigRole: { fontSize: 7.5, color: GRAY, marginTop: 2, textAlign: "center" },

  /* ── Footer ── */
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingHorizontal: 44, paddingVertical: 10, borderTopWidth: 1, borderTopColor: BORDER, backgroundColor: "#fff" },
  footerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  footerCol: { flexDirection: "column", gap: 2.5 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  footerLbl: { fontSize: 6.5, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 0.4 },
  footerVal: { fontSize: 7.5, color: DARK },
  footerDiv: { height: 1, backgroundColor: BORDER, marginBottom: 4 },
  footerCenter: { flexDirection: "row", justifyContent: "center" },
  footerFine: { fontSize: 6.5, color: GRAY, letterSpacing: 0.2, textAlign: "center" },
});

interface PixInfo { chave: string; nomeBeneficiario: string; tipo: string }

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
    cliente?: { nome: string; cnpj: string; email: string | null; responsavel: string | null } | null;
    avulsoNome?: string | null;
    avulsoCnpj?: string | null;
  };
  logoSrc?: string | null;
  qrCodeSrc?: string | null;
  pixInfo?: PixInfo | null;
  whatsappIconSrc?: string | null;
}

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDoc(doc: string) {
  const d = doc.replace(/\D/g, "");
  if (d.length <= 11) return { label: "CPF", formatted: d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4") };
  return { label: "CNPJ", formatted: d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") };
}

function fmtMes(date: Date) {
  const m = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const d = new Date(date);
  return `${m[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}

function fmtData(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function pixTypeLabel(t: string) {
  const m: Record<string, string> = { cpf: "CPF", cnpj: "CNPJ", email: "E-mail", phone: "Telefone", random: "Chave aleatória" };
  return m[t] || t.toUpperCase();
}

export default function ReciboPDF({ recibo, logoSrc, qrCodeSrc, pixInfo, whatsappIconSrc }: ReciboPDFProps) {
  const items = [
    { desc: "Honorários Contábeis", val: Number(recibo.honorario) },
    { desc: "13º Salário", val: Number(recibo.decimoTerceiro) },
    { desc: "Taxa de Registro", val: Number(recibo.registro) },
    { desc: "Alteração Contratual", val: Number(recibo.alteracao) },
    { desc: "Material de Expediente", val: Number(recibo.materialExpediente) },
    { desc: "Outros Serviços", val: Number(recibo.outros) },
  ].filter((i) => i.val > 0);

  const nome = recibo.cliente?.nome || recibo.avulsoNome || "Avulso";
  const cnpj = recibo.cliente?.cnpj || recibo.avulsoCnpj || "";
  const doc = fmtDoc(cnpj);
  const total = fmt(Number(recibo.total));

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />

        <View style={s.content}>
          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              {logoSrc && <Image style={s.logo} src={logoSrc} />}
              <View>
                <Text style={s.companyName}>J AMARAL CONTABIL</Text>
                <Text style={s.companySub}>Gestão Fiscal e Contábil</Text>
              </View>
            </View>
            <View style={s.headerRight}>
              <Text style={s.docTitle}>Recibo</Text>
              <Text style={s.docMeta}>Nº {recibo.id.slice(-6).toUpperCase()}</Text>
              <Text style={s.docMeta}>Emissão: {new Date(recibo.createdAt).toLocaleDateString("pt-BR")}</Text>
            </View>
          </View>

          <View style={s.hr} />

          {/* ── Cliente ── */}
          <View style={s.clientCard}>
            <Text style={s.clientTitle}>Prestação de serviços para</Text>
            <View style={s.clientRow}>
              <Text style={s.clientLabel}>Nome / Razão Social</Text>
              <Text style={s.clientValueBold}>{nome}</Text>
            </View>
            {cnpj !== "" && (
              <View style={s.clientRow}>
                <Text style={s.clientLabel}>{doc.label}</Text>
                <Text style={s.clientValue}>{doc.formatted}</Text>
              </View>
            )}
            {recibo.cliente?.responsavel && (
              <View style={s.clientRow}>
                <Text style={s.clientLabel}>Responsável</Text>
                <Text style={s.clientValue}>{recibo.cliente.responsavel}</Text>
              </View>
            )}
            {recibo.cliente?.email && (
              <View style={[s.clientRow, { marginBottom: 0 }]}>
                <Text style={s.clientLabel}>E-mail</Text>
                <Text style={s.clientValue}>{recibo.cliente.email}</Text>
              </View>
            )}
          </View>

          {/* ── Referência + Total ── */}
          <View style={s.refBar}>
            <View>
              <Text style={s.refLabel}>Mês de Referência</Text>
              <Text style={s.refValue}>{fmtMes(recibo.mesReferencia)}</Text>
            </View>
            <View style={{ alignItems: "flex-end" as const }}>
              <Text style={s.refLabel}>Valor Total</Text>
              <Text style={s.refValue}>{total}</Text>
            </View>
          </View>

          {/* ── Tabela de serviços ── */}
          <Text style={s.tableLabel}>Serviços Prestados</Text>
          <View style={s.table}>
            <View style={s.tHead}>
              <Text style={[s.tHeadText, s.descCol]}>Descrição</Text>
              <Text style={[s.tHeadText, s.valCol]}>Valor (R$)</Text>
            </View>
            {items.map((item, i) => (
              <View key={item.desc} style={[s.tRow, i === items.length - 1 ? s.tRowLast : {}, i % 2 === 1 ? s.tRowAlt : {}]}>
                <Text style={[s.cellText, s.descCol]}>{item.desc}</Text>
                <Text style={[s.cellValue, s.valCol]}>{fmt(item.val)}</Text>
              </View>
            ))}
            <View style={s.tTotal}>
              <Text style={s.tTotalLabel}>Total</Text>
              <Text style={s.tTotalValue}>{total}</Text>
            </View>
          </View>

          {/* ── Observações ── */}
          {recibo.detalhamento && (
            <View style={s.obsBox}>
              <Text style={s.obsTitle}>Observações</Text>
              <Text style={s.obsText}>{recibo.detalhamento}</Text>
            </View>
          )}

          {/* ── PIX ── */}
          {pixInfo && (
            <View style={s.pixBox}>
              <View style={s.pixLeft}>
                <Text style={s.pixTitle}>Pagamento via PIX</Text>
                {qrCodeSrc ? (
                  <>
                    <Text style={s.pixStep}>1. Abra o aplicativo do seu banco</Text>
                    <Text style={s.pixStep}>2. Escaneie o QR Code ao lado</Text>
                    <Text style={s.pixStep}>3. Confirme o pagamento de {total}</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.pixStep}>1. Abra o aplicativo do seu banco</Text>
                    <Text style={s.pixStep}>2. Selecione Pagar com PIX e copie a chave abaixo</Text>
                    <Text style={s.pixStep}>3. Informe o valor de {total}</Text>
                    <Text style={s.pixStep}>4. Confirme o pagamento</Text>
                  </>
                )}
                <View style={s.pixKeyCard}>
                  <Text style={s.pixKeyType}>Chave PIX ({pixTypeLabel(pixInfo.tipo)})</Text>
                  <Text style={s.pixKeyVal}>{pixInfo.chave}</Text>
                  <Text style={s.pixBenef}>Beneficiário: {pixInfo.nomeBeneficiario}</Text>
                </View>
              </View>
              {qrCodeSrc && (
                <View style={s.pixRight}>
                  <Image style={s.qr} src={qrCodeSrc} />
                  <Text style={s.qrCaption}>Escaneie para pagar</Text>
                  <Text style={s.qrAmount}>{total}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Assinatura ── */}
          <View style={s.sigArea}>
            <Text style={s.sigLocal}>Cariacica/ES, {fmtData(recibo.createdAt)}</Text>
            <View style={s.sigLine} />
            <Text style={s.sigName}>Jean Claude Rezende do Amaral</Text>
            <Text style={s.sigRole}>Contador — CRC-ES 008870/O-5</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <View style={s.footerRow}>
            <View style={s.footerCol}>
              <View style={s.footerItem}>
                <Text style={s.footerLbl}>Tel</Text>
                <Text style={s.footerVal}>(27) 3336-3213</Text>
              </View>
              <View style={s.footerItem}>
                <Text style={s.footerLbl}>Cel</Text>
                <Text style={s.footerVal}>(27) 99932-6612</Text>
              </View>
            </View>
            <View style={s.footerCol}>
              <View style={s.footerItem}>
                {whatsappIconSrc && <Image src={whatsappIconSrc} style={{ width: 9, height: 9 }} />}
                <Text style={s.footerVal}>(27) 99524-6812</Text>
              </View>
              <View style={s.footerItem}>
                <Text style={s.footerLbl}>E-mail</Text>
                <Text style={s.footerVal}>adm@jamaralcontabil.com.br</Text>
              </View>
            </View>
            <View style={s.footerCol}>
              <View style={s.footerItem}>
                <Text style={s.footerVal}>Rua Adley, 108 — Morada de Santa Fé</Text>
              </View>
              <View style={s.footerItem}>
                <Text style={s.footerVal}>Cariacica/ES — CEP 29.143-719</Text>
              </View>
            </View>
          </View>
          <View style={s.footerDiv} />
          <View style={s.footerCenter}>
            <Text style={s.footerFine}>J AMARAL CONTABIL — Jean Claude Rezende do Amaral — CRC-ES 008870/O-5 — Documento gerado eletronicamente</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
