import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles } from "./theme";
import {
  PdfHeader,
  PdfTitle,
  PdfSection,
  PdfKpis,
  PdfInfo,
  PdfFooter,
  PdfPill,
} from "./components";
import {
  formatBRL,
  formatDataBR,
  formatDocumento,
  formatTelefone,
} from "@/lib/format";
import type {
  ClientePrincipal,
  ExtratoCliente,
  CessaoResumo,
} from "@/types/database";

interface Props {
  cliente: ClientePrincipal;
  extrato: ExtratoCliente;
  cessoes: CessaoResumo[];
  emitidoEm: string;
}

export function ExtratoClientePDF({
  cliente,
  extrato,
  cessoes,
  emitidoEm,
}: Props) {
  return (
    <Document
      title={`Extrato — ${cliente.nome}`}
      author="Menezes Advocacia"
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Extrato consolidado"
          reportDate={emitidoEm}
        />

        <PdfTitle
          eyebrow="Cliente principal"
          title={cliente.nome}
          subtitle={`CPF/CNPJ: ${formatDocumento(cliente.documento)}`}
        />

        <PdfKpis
          items={[
            {
              label: "Volume total",
              value: formatBRL(extrato.volume_total),
            },
            {
              label: "Recebido",
              value: formatBRL(extrato.total_recebido),
            },
            {
              label: "Saldo a receber",
              value: formatBRL(extrato.saldo_devedor),
            },
            {
              label: "Cessões",
              value: `${extrato.total_cessoes} (${extrato.cessoes_quitadas} quit.)`,
            },
          ]}
        />

        <PdfSection title="Dados de contato">
          <View style={pdfStyles.infoGrid}>
            <View style={pdfStyles.infoCol}>
              <PdfInfo label="E-mail" value={cliente.email ?? ""} />
              <PdfInfo
                label="Telefone"
                value={formatTelefone(cliente.telefone)}
              />
            </View>
            <View style={pdfStyles.infoCol}>
              <PdfInfo
                label="Endereço"
                value={
                  cliente.endereco
                    ? formatarEndereco(cliente.endereco)
                    : ""
                }
              />
            </View>
          </View>
        </PdfSection>

        <PdfSection
          title={`Cessões cadastradas (${cessoes.length})`}
        >
          {cessoes.length === 0 ? (
            <Text style={{ fontSize: 10, color: "#6b7280", padding: 8 }}>
              Nenhuma cessão cadastrada para este cliente.
            </Text>
          ) : (
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: "14%" }]}>
                  Contrato
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "26%" }]}>
                  Cessionário
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "14%" }]}>
                  Cessão
                </Text>
                <Text
                  style={[
                    pdfStyles.tableHeaderCell,
                    pdfStyles.cellRight,
                    { width: "16%" },
                  ]}
                >
                  Valor
                </Text>
                <Text
                  style={[
                    pdfStyles.tableHeaderCell,
                    pdfStyles.cellRight,
                    { width: "16%" },
                  ]}
                >
                  Pago
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "14%" }]}>
                  Status
                </Text>
              </View>
              {cessoes.map((c, i) => (
                <View
                  key={c.id}
                  style={[
                    pdfStyles.tableRow,
                    i % 2 === 1 ? pdfStyles.tableRowAlt : {},
                  ]}
                  wrap={false}
                >
                  <Text
                    style={[
                      pdfStyles.tableCell,
                      pdfStyles.cellMono,
                      { width: "14%" },
                    ]}
                  >
                    {c.numero_contrato}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: "26%" }]}>
                    {c.cessionario_nome}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: "14%" }]}>
                    {formatDataBR(c.data_cessao)}
                  </Text>
                  <Text
                    style={[
                      pdfStyles.tableCell,
                      pdfStyles.cellRight,
                      pdfStyles.cellMono,
                      { width: "16%" },
                    ]}
                  >
                    {formatBRL(c.valor_total)}
                  </Text>
                  <Text
                    style={[
                      pdfStyles.tableCell,
                      pdfStyles.cellRight,
                      pdfStyles.cellMono,
                      { width: "16%" },
                    ]}
                  >
                    {formatBRL(c.valor_pago)}
                  </Text>
                  <View style={[pdfStyles.tableCell, { width: "14%" }]}>
                    <StatusPill
                      status={c.status}
                      atrasado={!!c.primeira_parcela_atrasada}
                    />
                  </View>
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
                      width: "54%",
                      color: "#c9a961",
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  TOTAIS
                </Text>
                <Text style={[pdfStyles.tableCell, { width: "14%" }]} />
                <Text
                  style={[
                    pdfStyles.tableCell,
                    pdfStyles.cellRight,
                    pdfStyles.cellMono,
                    {
                      width: "16%",
                      color: "#c9a961",
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  {formatBRL(extrato.volume_total)}
                </Text>
                <Text
                  style={[
                    pdfStyles.tableCell,
                    pdfStyles.cellRight,
                    pdfStyles.cellMono,
                    {
                      width: "16%",
                      color: "#c9a961",
                      fontFamily: "Helvetica-Bold",
                    },
                  ]}
                >
                  {formatBRL(extrato.total_recebido)}
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

function StatusPill({
  status,
  atrasado,
}: {
  status: CessaoResumo["status"];
  atrasado: boolean;
}) {
  if (atrasado && status === "ativa")
    return <PdfPill variant="danger">Em atraso</PdfPill>;
  const map = {
    ativa: <PdfPill variant="gold">Ativa</PdfPill>,
    quitada: <PdfPill variant="success">Quitada</PdfPill>,
    inadimplente: <PdfPill variant="danger">Inadimplente</PdfPill>,
    cancelada: <PdfPill variant="neutral">Cancelada</PdfPill>,
  } as const;
  return map[status];
}

function formatarEndereco(e: NonNullable<ClientePrincipal["endereco"]>): string {
  const parts = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join("/"),
    e.cep,
  ].filter(Boolean);
  return parts.join(" — ");
}
