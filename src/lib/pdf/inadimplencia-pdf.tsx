import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "./theme";
import {
  PdfHeader,
  PdfTitle,
  PdfSection,
  PdfKpis,
  PdfFooter,
} from "./components";
import { formatBRL, formatDataBR, formatDocumento } from "@/lib/format";
import type { InadimplenciaItem } from "@/types/database";

interface Props {
  itens: InadimplenciaItem[];
  emitidoEm: string;
}

export function InadimplenciaPDF({ itens, emitidoEm }: Props) {
  const totalValor = itens.reduce((s, i) => s + Number(i.valor), 0);
  const clientesUnicos = new Set(itens.map((i) => i.cliente_id)).size;
  const cessoesUnicas = new Set(itens.map((i) => i.numero_contrato)).size;

  return (
    <Document
      title="Relatório de Inadimplência"
      author="Menezes Advocacia"
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Relatório de inadimplência"
          reportDate={emitidoEm}
        />

        <PdfTitle
          eyebrow="Cobrança"
          title="Parcelas em atraso"
          subtitle="Relação consolidada de pagamentos vencidos e não quitados"
        />

        <PdfKpis
          items={[
            { label: "Parcelas em atraso", value: String(itens.length) },
            { label: "Valor total", value: formatBRL(totalValor) },
            { label: "Cessões afetadas", value: String(cessoesUnicas) },
            {
              label: "Clientes afetados",
              value: String(clientesUnicos),
            },
          ]}
        />

        <PdfSection title={`Detalhamento (${itens.length})`}>
          {itens.length === 0 ? (
            <Text style={{ fontSize: 10, color: "#6b7280", padding: 8 }}>
              Nenhuma parcela em atraso. Carteira em dia. ✓
            </Text>
          ) : (
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: "26%" }]}>
                  Cliente
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "16%" }]}>
                  Contrato
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "8%" }]}>
                  Parc.
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "16%" }]}>
                  Vencimento
                </Text>
                <Text
                  style={[
                    pdfStyles.tableHeaderCell,
                    pdfStyles.cellRight,
                    { width: "10%" },
                  ]}
                >
                  Atraso
                </Text>
                <Text
                  style={[
                    pdfStyles.tableHeaderCell,
                    pdfStyles.cellRight,
                    { width: "24%" },
                  ]}
                >
                  Valor
                </Text>
              </View>
              {itens.map((it, i) => (
                <View
                  key={it.pagamento_id}
                  style={[
                    pdfStyles.tableRow,
                    i % 2 === 1 ? pdfStyles.tableRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <View style={[pdfStyles.tableCell, { width: "26%" }]}>
                    <Text>{it.cliente_nome}</Text>
                    <Text
                      style={[
                        pdfStyles.cellMono,
                        { fontSize: 7, color: "#6b7280" },
                      ]}
                    >
                      {formatDocumento(it.cliente_documento)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      pdfStyles.tableCell,
                      pdfStyles.cellMono,
                      { width: "16%" },
                    ]}
                  >
                    {it.numero_contrato}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: "8%" }]}>
                    {it.numero_parcela}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: "16%" }]}>
                    {formatDataBR(it.data_vencimento)}
                  </Text>
                  <Text
                    style={[
                      pdfStyles.tableCell,
                      pdfStyles.cellRight,
                      { width: "10%", color: "#dc2626" },
                    ]}
                  >
                    {it.dias_atraso} d
                  </Text>
                  <Text
                    style={[
                      pdfStyles.tableCell,
                      pdfStyles.cellRight,
                      pdfStyles.cellMono,
                      { width: "24%", color: "#dc2626" },
                    ]}
                  >
                    {formatBRL(it.valor)}
                  </Text>
                </View>
              ))}
              <View
                style={[
                  pdfStyles.tableRow,
                  { backgroundColor: "#0a1628" },
                ]}
              >
                <Text
                  style={[
                    pdfStyles.tableCell,
                    {
                      width: "76%",
                      color: "#c9a961",
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  TOTAL EM ATRASO
                </Text>
                <Text
                  style={[
                    pdfStyles.tableCell,
                    pdfStyles.cellRight,
                    pdfStyles.cellMono,
                    {
                      width: "24%",
                      color: "#c9a961",
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  {formatBRL(totalValor)}
                </Text>
              </View>
            </View>
          )}
        </PdfSection>

        <PdfFooter legenda="Documento sigiloso — protegido por dever de sigilo profissional (OAB)" />
      </Page>
    </Document>
  );
}
