import { Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "./theme";

/* Cabeçalho padrão de relatório */
export function PdfHeader({
  reportTitle,
  reportDate,
  razaoSocial = "Menezes Advocacia",
}: {
  reportTitle: string;
  reportDate: string;
  razaoSocial?: string;
}) {
  const firstLetter = razaoSocial.charAt(0).toUpperCase();
  return (
    <View style={pdfStyles.header} fixed>
      <View style={pdfStyles.brand}>
        <View style={pdfStyles.logoBox}>
          <Text style={pdfStyles.logoLetter}>{firstLetter}</Text>
        </View>
        <View style={pdfStyles.brandText}>
          <Text style={pdfStyles.brandLine1}>
            {razaoSocial.toUpperCase()}
          </Text>
          <Text style={pdfStyles.brandLine2}>Painel Financeiro</Text>
        </View>
      </View>
      <View style={pdfStyles.reportMeta}>
        <Text style={pdfStyles.reportTitle}>{reportTitle}</Text>
        <Text style={pdfStyles.reportDate}>Emitido em {reportDate}</Text>
      </View>
    </View>
  );
}

/* Título principal do relatório */
export function PdfTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={pdfStyles.titleBlock}>
      {eyebrow && <Text style={pdfStyles.eyebrow}>{eyebrow}</Text>}
      <Text style={pdfStyles.pageTitle}>{title}</Text>
      {subtitle && <Text style={pdfStyles.pageSubtitle}>{subtitle}</Text>}
    </View>
  );
}

/* Seção com título */
export function PdfSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

/* Linha de KPIs */
export function PdfKpis({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <View style={pdfStyles.kpiRow}>
      {items.map((k) => (
        <View key={k.label} style={pdfStyles.kpi}>
          <Text style={pdfStyles.kpiLabel}>{k.label}</Text>
          <Text style={pdfStyles.kpiValue}>{k.value}</Text>
        </View>
      ))}
    </View>
  );
}

/* Bloco de informação rotulada */
export function PdfInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <>
      <Text style={pdfStyles.infoLabel}>{label}</Text>
      <Text style={pdfStyles.infoValue}>{value || "—"}</Text>
    </>
  );
}

/* Rodapé fixo (rodapé persistente em todas as páginas) */
export function PdfFooter({
  legenda = "Documento gerado pelo sistema Painel Financeiro — uso interno do escritório",
  contato,
}: {
  legenda?: string;
  contato?: string;
}) {
  return (
    <View style={pdfStyles.footer} fixed>
      <View>
        <Text>{legenda}</Text>
        {contato && (
          <Text style={{ marginTop: 2, opacity: 0.7 }}>{contato}</Text>
        )}
      </View>
      <Text
        render={({ pageNumber, totalPages }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}

/* Pill colorido para status */
export function PdfPill({
  variant,
  children,
}: {
  variant: "success" | "danger" | "neutral" | "gold";
  children: string;
}) {
  const map = {
    success: { bg: "#d1fae5", color: "#065f46" },
    danger: { bg: "#fee2e2", color: "#991b1b" },
    neutral: { bg: "#e5e7eb", color: PDF_COLORS.textMuted },
    gold: { bg: "#fef3c7", color: PDF_COLORS.goldDark },
  } as const;
  const c = map[variant];
  return (
    <Text
      style={{
        ...pdfStyles.pill,
        backgroundColor: c.bg,
        color: c.color,
      }}
    >
      {children}
    </Text>
  );
}
