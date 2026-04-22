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
  Cessionario,
  CessaoResumo,
  Configuracoes,
} from "@/types/database";

interface Props {
  cessionario: Cessionario;
  cessoes: CessaoResumo[];
  totais: {
    volume: number;
    recebido: number;
    saldo: number;
  };
  emitidoEm: string;
  config: Configuracoes;
}

export function ExtratoCessionarioPDF({
  cessionario,
  cessoes,
  totais,
  emitidoEm,
  config,
}: Props) {
  const ativas = cessoes.filter((c) => c.status !== "quitada").length;
  const quitadas = cessoes.filter((c) => c.status === "quitada").length;

  return (
    <Document
      title={`Extrato do cessionário — ${cessionario.nome}`}
      author={config.razao_social}
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Extrato do cessionário"
          reportDate={emitidoEm}
          razaoSocial={config.razao_social}
        />

        <PdfTitle
          eyebrow={`Cessionário (${cessionario.tipo_pessoa ?? "—"})`}
          title={cessionario.nome}
          subtitle={`CPF/CNPJ: ${formatDocumento(cessionario.documento)}`}
        />

        <PdfKpis
          items={[
            {
              label: "Volume vinculado",
              value: formatBRL(totais.volume),
            },
            {
              label: "Recebido",
              value: formatBRL(totais.recebido),
            },
            {
              label: "Saldo a receber",
              value: formatBRL(totais.saldo),
            },
            {
              label: "Cessões",
              value: `${cessoes.length} (${quitadas} quit.)`,
            },
          ]}
        />

        <PdfSection title="Dados do contrato">
          <View style={pdfStyles.infoGrid}>
            <View style={pdfStyles.infoCol}>
              <PdfInfo
                label="Data do contrato"
                value={
                  cessionario.data_contrato
                    ? formatDataBR(cessionario.data_contrato)
                    : "—"
                }
              />
              <PdfInfo
                label="Valor contratado"
                value={
                  cessionario.valor_contratado != null
                    ? formatBRL(cessionario.valor_contratado)
                    : "—"
                }
              />
              <PdfInfo
                label="Valor da cessão"
                value={
                  cessionario.valor_cessao != null
                    ? formatBRL(cessionario.valor_cessao)
                    : "—"
                }
              />
            </View>
            <View style={pdfStyles.infoCol}>
              <PdfInfo
                label="% cedida"
                value={
                  cessionario.percentual != null
                    ? `${Number(cessionario.percentual).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })}%`
                    : "—"
                }
              />
              <PdfInfo
                label="Cessões ativas"
                value={String(ativas)}
              />
              <PdfInfo
                label="Cessões quitadas"
                value={String(quitadas)}
              />
            </View>
          </View>
        </PdfSection>

        <PdfSection title="Dados de contato">
          <View style={pdfStyles.infoGrid}>
            <View style={pdfStyles.infoCol}>
              <PdfInfo label="E-mail" value={cessionario.email ?? ""} />
              <PdfInfo
                label="Telefone"
                value={formatTelefone(cessionario.telefone)}
              />
            </View>
            <View style={pdfStyles.infoCol}>
              <PdfInfo
                label="Endereço"
                value={
                  cessionario.endereco
                    ? formatarEndereco(cessionario.endereco)
                    : ""
                }
              />
            </View>
          </View>
        </PdfSection>

        {cessionario.banco && (
          <PdfSection title="Dados bancários">
            <View style={pdfStyles.infoGrid}>
              <View style={pdfStyles.infoCol}>
                <PdfInfo label="Banco" value={cessionario.banco.banco ?? ""} />
                <PdfInfo
                  label="Agência"
                  value={cessionario.banco.agencia ?? ""}
                />
                <PdfInfo label="Conta" value={cessionario.banco.conta ?? ""} />
              </View>
              <View style={pdfStyles.infoCol}>
                <PdfInfo
                  label="Tipo"
                  value={
                    cessionario.banco.tipo === "corrente"
                      ? "Corrente"
                      : cessionario.banco.tipo === "poupanca"
                        ? "Poupança"
                        : ""
                  }
                />
                <PdfInfo label="PIX" value={cessionario.banco.pix ?? ""} />
              </View>
            </View>
          </PdfSection>
        )}

        <PdfSection
          title={`Cessões vinculadas (${cessoes.length})`}
        >
          {cessoes.length === 0 ? (
            <Text style={{ fontSize: 10, color: "#6b7280", padding: 8 }}>
              Nenhuma cessão cadastrada para este cessionário.
            </Text>
          ) : (
            <View style={pdfStyles.table}>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: "14%" }]}>
                  Contrato
                </Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: "26%" }]}>
                  Cedente
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
                  Recebido
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
                    {c.cliente_nome}
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
                  {formatBRL(totais.volume)}
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
                  {formatBRL(totais.recebido)}
                </Text>
              </View>
            </View>
          )}
        </PdfSection>

        <PdfFooter
          legenda={
            config.legenda_pdf
              ? `${config.legenda_pdf} — sigilo profissional OAB`
              : "Documento sigiloso — protegido por dever de sigilo profissional (OAB)"
          }
          contato={
            [
              config.telefone,
              config.email,
              config.cnpj ? `CNPJ ${config.cnpj}` : null,
            ]
              .filter(Boolean)
              .join("  ·  ") || undefined
          }
        />
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

function formatarEndereco(e: NonNullable<Cessionario["endereco"]>): string {
  const parts = [
    [e.logradouro, e.numero].filter(Boolean).join(", "),
    e.complemento,
    e.bairro,
    [e.cidade, e.uf].filter(Boolean).join("/"),
    e.cep,
  ].filter(Boolean);
  return parts.join(" — ");
}
