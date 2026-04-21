import {
  Document,
  Page,
  Text,
  View,
} from "@react-pdf/renderer";
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
  CessaoCredito,
  ClientePrincipal,
  Cessionario,
  Pagamento,
  Configuracoes,
} from "@/types/database";

interface Props {
  cessao: CessaoCredito;
  cliente: Pick<ClientePrincipal, "nome" | "documento" | "email" | "telefone">;
  cessionario: Pick<Cessionario, "nome" | "documento" | "email" | "telefone">;
  parcelas: Pagamento[];
  emitidoEm: string;
  config: Configuracoes;
}

export function CessaoPDF({
  cessao,
  cliente,
  cessionario,
  parcelas,
  emitidoEm,
  config,
}: Props) {
  const saldo = Number(cessao.valor_total) - Number(cessao.valor_pago);
  const pct =
    cessao.valor_total > 0
      ? (Number(cessao.valor_pago) / Number(cessao.valor_total)) * 100
      : 0;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <Document
      title={`Cessão ${cessao.numero_contrato}`}
      author={config.razao_social}
    >
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Relatório de cessão"
          reportDate={emitidoEm}
          razaoSocial={config.razao_social}
        />

        <PdfTitle
          eyebrow="Cessão de crédito"
          title={`Contrato ${cessao.numero_contrato}`}
          subtitle={`${cliente.nome}  →  ${cessionario.nome}`}
        />

        <PdfKpis
          items={[
            { label: "Valor total", value: formatBRL(cessao.valor_total) },
            { label: "Pago", value: formatBRL(cessao.valor_pago) },
            { label: "Saldo devedor", value: formatBRL(saldo) },
            { label: "% Pago", value: `${pct.toFixed(1)}%` },
          ]}
        />

        <PdfSection title="Partes do contrato">
          <View style={pdfStyles.infoGrid}>
            <View style={pdfStyles.infoCol}>
              <PdfInfo label="Cliente principal (cedente)" value={cliente.nome} />
              <PdfInfo
                label="CPF/CNPJ"
                value={formatDocumento(cliente.documento)}
              />
              <PdfInfo label="E-mail" value={cliente.email ?? ""} />
              <PdfInfo
                label="Telefone"
                value={formatTelefone(cliente.telefone)}
              />
            </View>
            <View style={pdfStyles.infoCol}>
              <PdfInfo
                label="Cessionário (recebedor)"
                value={cessionario.nome}
              />
              <PdfInfo
                label="CPF/CNPJ"
                value={formatDocumento(cessionario.documento)}
              />
              <PdfInfo label="E-mail" value={cessionario.email ?? ""} />
              <PdfInfo
                label="Telefone"
                value={formatTelefone(cessionario.telefone)}
              />
            </View>
          </View>
        </PdfSection>

        <PdfSection title="Dados do contrato">
          <View style={pdfStyles.infoGrid}>
            <View style={pdfStyles.infoCol}>
              <PdfInfo
                label="Data da cessão"
                value={formatDataBR(cessao.data_cessao)}
              />
              <PdfInfo
                label="Vencimento da 1ª parcela"
                value={formatDataBR(cessao.data_vencimento_inicial)}
              />
              <PdfInfo
                label="Quantidade de parcelas"
                value={String(cessao.parcelas_total)}
              />
              <PdfInfo
                label="Percentual cedido"
                value={
                  cessao.percentual_cedido != null
                    ? `${Number(cessao.percentual_cedido).toFixed(2)}%`
                    : ""
                }
              />
            </View>
            <View style={pdfStyles.infoCol}>
              <PdfInfo label="Status" value={traduzirStatus(cessao.status)} />
              <PdfInfo
                label="Taxa de juros (% ao mês)"
                value={String(cessao.taxa_juros ?? 0)}
              />
              <PdfInfo
                label="Observações"
                value={cessao.observacoes ?? ""}
              />
            </View>
          </View>
        </PdfSection>

        <PdfSection title={`Cronograma de parcelas (${parcelas.length})`}>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: "8%" }]}>
                #
              </Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: "18%" }]}>
                Vencimento
              </Text>
              <Text
                style={[
                  pdfStyles.tableHeaderCell,
                  pdfStyles.cellRight,
                  { width: "20%" },
                ]}
              >
                Valor
              </Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: "18%" }]}>
                Pago em
              </Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: "16%" }]}>
                Status
              </Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: "20%" }]}>
                Observações
              </Text>
            </View>
            {parcelas.map((p, i) => (
              <View
                key={p.id}
                style={[
                  pdfStyles.tableRow,
                  i % 2 === 1 ? pdfStyles.tableRowAlt : {},
                ]}
                wrap={false}
              >
                <Text style={[pdfStyles.tableCell, { width: "8%" }]}>
                  {p.numero_parcela}
                  {p.is_reversal ? "*" : ""}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: "18%" }]}>
                  {formatDataBR(p.data_vencimento)}
                </Text>
                <Text
                  style={[
                    pdfStyles.tableCell,
                    pdfStyles.cellRight,
                    pdfStyles.cellMono,
                    { width: "20%" },
                  ]}
                >
                  {p.is_reversal ? "−" : ""}
                  {formatBRL(p.valor)}
                </Text>
                <Text
                  style={[
                    pdfStyles.tableCell,
                    { width: "18%", color: p.data_pagamento ? "#1f2937" : "#9ca3af" },
                  ]}
                >
                  {formatDataBR(p.data_pagamento)}
                </Text>
                <View style={[pdfStyles.tableCell, { width: "16%" }]}>
                  <ParcelaPill parcela={p} hoje={hoje} />
                </View>
                <Text
                  style={[
                    pdfStyles.tableCell,
                    { width: "20%", color: "#6b7280" },
                  ]}
                >
                  {p.observacoes ?? ""}
                </Text>
              </View>
            ))}
          </View>
        </PdfSection>

        <PdfFooter
          legenda={
            config.legenda_pdf ??
            "Documento gerado pelo sistema Painel Financeiro"
          }
          contato={formatarContato(config)}
        />
      </Page>
    </Document>
  );
}

function formatarContato(c: Configuracoes): string | undefined {
  const partes = [c.telefone, c.email, c.site, c.cnpj ? `CNPJ ${c.cnpj}` : null]
    .filter(Boolean)
    .join("  ·  ");
  return partes || undefined;
}

function ParcelaPill({ parcela, hoje }: { parcela: Pagamento; hoje: string }) {
  if (parcela.is_reversal) return <PdfPill variant="danger">Estorno</PdfPill>;
  if (parcela.data_pagamento) return <PdfPill variant="success">Pago</PdfPill>;
  if (parcela.data_vencimento < hoje)
    return <PdfPill variant="danger">Atrasado</PdfPill>;
  return <PdfPill variant="gold">Aberto</PdfPill>;
}

function traduzirStatus(s: CessaoCredito["status"]): string {
  const map = {
    ativa: "Ativa",
    quitada: "Quitada",
    inadimplente: "Inadimplente",
    cancelada: "Cancelada",
  } as const;
  return map[s];
}
