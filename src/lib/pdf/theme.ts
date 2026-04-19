import { StyleSheet } from "@react-pdf/renderer";

/**
 * Tokens visuais para PDFs do Painel MNZ.
 * Mantém a identidade Menezes Advocacia (azul marinho + dourado).
 */
export const PDF_COLORS = {
  navy: "#0a1628",
  navyLight: "#1e3a5f",
  gold: "#c9a961",
  goldDark: "#a8843e",
  white: "#ffffff",
  text: "#1f2937",
  textMuted: "#6b7280",
  divider: "#e5e7eb",
  success: "#10b981",
  danger: "#dc2626",
  surface: "#f9fafb",
};

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 56,
    paddingHorizontal: 36,
    fontSize: 10,
    color: PDF_COLORS.text,
    fontFamily: "Helvetica",
  },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.gold,
    marginBottom: 20,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  logoBox: {
    width: 36,
    height: 36,
    backgroundColor: PDF_COLORS.navy,
    borderWidth: 1.5,
    borderColor: PDF_COLORS.gold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  logoLetter: {
    color: PDF_COLORS.gold,
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  brandText: { flexDirection: "column" },
  brandLine1: {
    fontSize: 8,
    color: PDF_COLORS.gold,
    letterSpacing: 2,
    fontFamily: "Helvetica-Bold",
  },
  brandLine2: {
    fontSize: 14,
    color: PDF_COLORS.navy,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  reportMeta: { textAlign: "right" },
  reportTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.navy,
  },
  reportDate: { fontSize: 8, color: PDF_COLORS.textMuted, marginTop: 2 },

  /* Title block */
  titleBlock: { marginBottom: 18 },
  eyebrow: {
    fontSize: 8,
    color: PDF_COLORS.gold,
    letterSpacing: 1.5,
    fontFamily: "Helvetica-Bold",
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    color: PDF_COLORS.navy,
  },
  pageSubtitle: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
    marginTop: 4,
  },

  /* KPI grid */
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  kpi: {
    flex: 1,
    padding: 10,
    backgroundColor: PDF_COLORS.surface,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.gold,
  },
  kpiLabel: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
    color: PDF_COLORS.navy,
  },

  /* Section */
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.textMuted,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.divider,
  },

  /* Info two-column */
  infoGrid: { flexDirection: "row", gap: 16 },
  infoCol: { flex: 1 },
  infoLabel: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 10,
    color: PDF_COLORS.text,
    marginBottom: 8,
  },

  /* Table */
  table: { borderWidth: 1, borderColor: PDF_COLORS.divider },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.navy,
  },
  tableHeaderCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 8,
    color: PDF_COLORS.gold,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.divider,
  },
  tableRowAlt: { backgroundColor: PDF_COLORS.surface },
  tableCell: {
    paddingVertical: 5,
    paddingHorizontal: 6,
    fontSize: 9,
  },
  cellRight: { textAlign: "right" },
  cellMono: { fontFamily: "Courier" },

  /* Footer */
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: PDF_COLORS.textMuted,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.divider,
  },

  /* Status pills */
  pill: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    borderRadius: 2,
  },
});
