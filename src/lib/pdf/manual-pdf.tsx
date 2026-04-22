import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { pdfStyles, PDF_COLORS } from "./theme";
import { PdfHeader, PdfTitle, PdfFooter } from "./components";

interface Props {
  emitidoEm: string;
  razaoSocial: string;
}

interface PassoProps {
  numero: number;
  titulo: string;
  descricao: string;
}

function Passo({ numero, titulo, descricao }: PassoProps) {
  return (
    <View style={styles.passo}>
      <View style={styles.passoNumero}>
        <Text style={styles.passoNumeroText}>{numero}</Text>
      </View>
      <View style={styles.passoTexto}>
        <Text style={styles.passoTitulo}>{titulo}</Text>
        <Text style={styles.passoDesc}>{descricao}</Text>
      </View>
    </View>
  );
}

interface SecaoManualProps {
  numero: string;
  titulo: string;
  intro?: string;
  passos: { titulo: string; descricao: string }[];
  dica?: string;
}

function SecaoManual({
  numero,
  titulo,
  intro,
  passos,
  dica,
}: SecaoManualProps) {
  return (
    <View style={styles.secao} wrap={false}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoNumero}>{numero}</Text>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
      </View>
      {intro && <Text style={styles.intro}>{intro}</Text>}
      <View style={{ marginTop: 6 }}>
        {passos.map((p, i) => (
          <Passo
            key={i}
            numero={i + 1}
            titulo={p.titulo}
            descricao={p.descricao}
          />
        ))}
      </View>
      {dica && (
        <View style={styles.dica}>
          <Text style={styles.dicaLabel}>Dica</Text>
          <Text style={styles.dicaTexto}>{dica}</Text>
        </View>
      )}
    </View>
  );
}

export function ManualPDF({ emitidoEm, razaoSocial }: Props) {
  return (
    <Document title="Manual de uso — Painel Financeiro" author={razaoSocial}>
      {/* CAPA + ÍNDICE */}
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Manual de uso"
          reportDate={emitidoEm}
          razaoSocial={razaoSocial}
        />
        <PdfTitle
          eyebrow="GUIA DO ADMINISTRADOR"
          title="Como usar o Painel Financeiro"
          subtitle="Tudo que você precisa pra cadastrar clientes, registrar pagamentos, anexar comprovantes e manter os números atualizados sem precisar do Excel do contador."
        />

        <View style={styles.indice}>
          <Text style={styles.indiceTitulo}>O que tem aqui dentro</Text>
          <IndiceItem n="1" t="Conceitos básicos" />
          <IndiceItem n="2" t="Pagamentos no dia a dia" />
          <IndiceItem n="3" t="Cessões de crédito" />
          <IndiceItem n="4" t="Cessionários" />
          <IndiceItem n="5" t="Clientes principais" />
          <IndiceItem n="6" t="Comprovantes" />
          <IndiceItem n="7" t="Importar planilha mensal" />
          <IndiceItem n="8" t="Quem pode fazer o quê" />
          <IndiceItem n="9" t="Atalhos e dicas" />
        </View>

        <View style={styles.callout}>
          <Text style={styles.calloutTitulo}>Princípio principal</Text>
          <Text style={styles.calloutTexto}>
            Tudo é rastreado. Excluir não é o padrão — pra desfazer um pagamento
            usamos &ldquo;Estornar&rdquo;, que cria um lançamento contrário e
            mantém o histórico pra auditoria. Ações destrutivas pedem sua senha.
          </Text>
        </View>

        <PdfFooter
          legenda="Manual de uso — Painel Financeiro"
          contato="Sistema proprietário"
        />
      </Page>

      {/* SEÇÃO 1 — CONCEITOS */}
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Manual de uso"
          reportDate={emitidoEm}
          razaoSocial={razaoSocial}
        />

        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>1</Text>
            <Text style={styles.secaoTitulo}>Conceitos básicos</Text>
          </View>
          <Text style={styles.intro}>
            O sistema organiza os recebíveis em quatro entidades. Entender essa
            hierarquia ajuda a saber onde clicar.
          </Text>

          <ConceitoItem
            nome="Cliente principal"
            desc="Pessoa ou empresa que cedeu o direito de receber (ex: Marcos André de Andrade). Tem dados pessoais, endereço e várias cessões."
          />
          <ConceitoItem
            nome="Cessionário"
            desc="Quem está pagando — o devedor de cada contrato (ex: HM, BOLOVO 2). Pode aparecer em mais de uma cessão."
          />
          <ConceitoItem
            nome="Cessão de crédito"
            desc="O contrato em si. Liga cliente principal a um cessionário, com valor total, número de parcelas e prazo."
          />
          <ConceitoItem
            nome="Pagamento (parcela)"
            desc="Cada recebimento individual da cessão. Tem data de vencimento, data de pagamento, valor e (opcional) comprovante anexado."
          />
        </View>

        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>2</Text>
            <Text style={styles.secaoTitulo}>Pagamentos no dia a dia</Text>
          </View>
          <Text style={styles.intro}>
            Esse é o fluxo mais comum. Quase tudo que você vai fazer rotineiramente
            é registrar pagamento, anexar comprovante e (raramente) corrigir algo.
          </Text>
        </View>

        <SecaoManual
          numero="2.1"
          titulo="Marcar parcela como paga"
          passos={[
            {
              titulo: "Abrir a cessão",
              descricao:
                "No menu superior: Cessões → clica na cessão (ou: Clientes → cliente → linha da cessão → Abrir).",
            },
            {
              titulo: "Localizar a parcela",
              descricao:
                "Role até a tabela de parcelas (logo abaixo dos cards). As ainda não pagas têm o botão Pagar do lado direito.",
            },
            {
              titulo: "Clicar em Pagar",
              descricao:
                "Vai abrir um modal com data de pagamento (preenchida com hoje) e valor (já vem o valor da parcela; pode editar pra pagamento parcial).",
            },
            {
              titulo: "Confirmar",
              descricao:
                "A parcela vira verde com status Pago. Os cards do topo da cessão atualizam automaticamente (Pago, Saldo).",
            },
          ]}
          dica="Pagamento parcial: se o cliente pagou só uma parte, mude o valor no modal. O sistema cria o saldo restante na próxima parcela ou em parcela nova."
        />

        <PdfFooter
          legenda="Manual de uso — Painel Financeiro"
          contato="Sistema proprietário"
        />
      </Page>

      {/* SEÇÃO 2 (continuação) — PAGAMENTOS */}
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Manual de uso"
          reportDate={emitidoEm}
          razaoSocial={razaoSocial}
        />

        <SecaoManual
          numero="2.2"
          titulo="Anexar comprovante"
          passos={[
            {
              titulo: "Achar a parcela paga",
              descricao:
                "Na tabela de parcelas da cessão, parcelas pagas têm botão Anexar (se ainda sem comprovante) ou Substituir (se já tem).",
            },
            {
              titulo: "Selecionar arquivo",
              descricao:
                "Aceita PDF, JPG, PNG, WEBP, HEIC. Tamanho máximo 5 MB. Imagens grandes são comprimidas automaticamente.",
            },
            {
              titulo: "Confirmar upload",
              descricao:
                "Aparece um indicador 📎 do lado da parcela. Pra abrir, clica em Ver — gera link válido por 5 minutos.",
            },
          ]}
          dica="Pode anexar comprovante depois — não precisa ser na hora do pagamento. Útil quando o cliente envia o PDF dias depois."
        />

        <SecaoManual
          numero="2.3"
          titulo="Estornar (desmarcar pagamento)"
          intro="Use quando registrou um pagamento errado, ou o cliente pediu reembolso."
          passos={[
            {
              titulo: "Abrir a cessão",
              descricao: "Cessão → linha da parcela paga → botão Estornar.",
            },
            {
              titulo: "Justificar",
              descricao:
                "Modal pede o motivo (texto livre, ex: 'cliente solicitou reembolso') e sua senha.",
            },
            {
              titulo: "Confirmar",
              descricao:
                "O sistema cria um lançamento de reversão. A parcela original NÃO é apagada — fica no histórico marcada como estornada, e os valores totais voltam ao estado anterior.",
            },
          ]}
          dica="Por que não simplesmente apagar? Auditoria. Se o cliente questionar o que aconteceu, dá pra mostrar exatamente quando foi pago e quando foi estornado, com motivo e responsável."
        />

        <SecaoManual
          numero="2.4"
          titulo="Editar valor ou data de vencimento da parcela"
          passos={[
            {
              titulo: "Pré-condição",
              descricao:
                "Só funciona em parcelas AINDA NÃO PAGAS. Se já estiver paga, primeiro Estorne e depois edite.",
            },
            {
              titulo: "Abrir edição",
              descricao:
                "Cessão → parcela não paga → botão Editar.",
            },
            {
              titulo: "Alterar e salvar",
              descricao:
                "Pode mudar valor e data de vencimento. Útil quando o cliente renegociou a data ou valor.",
            },
          ]}
        />

        <PdfFooter
          legenda="Manual de uso — Painel Financeiro"
          contato="Sistema proprietário"
        />
      </Page>

      {/* SEÇÃO 3-5 — CESSÕES, CESSIONÁRIOS, CLIENTES */}
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Manual de uso"
          reportDate={emitidoEm}
          razaoSocial={razaoSocial}
        />

        <SecaoManual
          numero="3"
          titulo="Cessões de crédito"
          passos={[
            {
              titulo: "Criar nova cessão",
              descricao:
                "Menu → Cessões → + Nova cessão. Escolhe cliente, cessionário, valor total, número de parcelas, data de vencimento da primeira parcela. O sistema gera as parcelas automaticamente.",
            },
            {
              titulo: "Editar cessão existente",
              descricao:
                "Abrir cessão → Editar. Permite alterar nº contrato, taxa de juros, % cedido e observações. NÃO altera valor total nem nº de parcelas (pra preservar o histórico de pagamentos).",
            },
            {
              titulo: "Cancelar cessão",
              descricao:
                "Abrir cessão → Cancelar cessão. Marca como cancelada (não some da lista, mas vai pro histórico). Pede confirmação digitando o nº do contrato + senha.",
            },
          ]}
          dica="Se precisar mudar o valor de um contrato em andamento, o jeito certo é cancelar a cessão atual e criar uma nova com o valor correto."
        />

        <SecaoManual
          numero="4"
          titulo="Cessionários"
          passos={[
            {
              titulo: "Cadastrar novo",
              descricao:
                "Menu → Cessionários → + Novo. Pede nome, CPF/CNPJ, e-mail, telefone, dados bancários (banco, agência, conta, PIX). Use isso pra futuras cessões com a mesma pessoa.",
            },
            {
              titulo: "Editar",
              descricao:
                "Cessionários → clica → Editar. Atualize CPF (se foi importado da planilha vem como PENDENTE), dados bancários, contato.",
            },
            {
              titulo: "Desativar (em vez de excluir)",
              descricao:
                "Editar → desmarca a caixa Ativo. O cadastro continua no banco mas não aparece em listas de seleção. Use quando o cliente saiu mas tem histórico.",
            },
            {
              titulo: "Excluir definitivo",
              descricao:
                "Cessionários → clica → Excluir. SÓ funciona se não tiver nenhuma cessão vinculada. Senão precisa cancelar as cessões antes ou usar Desativar.",
            },
          ]}
        />

        <SecaoManual
          numero="5"
          titulo="Clientes principais"
          passos={[
            {
              titulo: "Cadastrar / Editar / Excluir",
              descricao:
                "Funciona igual aos cessionários. Vai em Clientes → + Novo cliente. Pra editar ou excluir, abra o cliente e use os botões no topo.",
            },
            {
              titulo: "Imprimir extrato",
              descricao:
                "Na página do cliente, botão Extrato PDF gera um documento com todas as cessões, valores totais e situação. Útil pra mandar pro cliente ver onde está.",
            },
            {
              titulo: "Compartilhar via WhatsApp",
              descricao:
                "Botão WhatsApp ao lado do Extrato PDF: já abre o WhatsApp Web com mensagem pronta e link do extrato.",
            },
          ]}
        />

        <PdfFooter
          legenda="Manual de uso — Painel Financeiro"
          contato="Sistema proprietário"
        />
      </Page>

      {/* SEÇÃO 6-7 — COMPROVANTES, IMPORTAR */}
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Manual de uso"
          reportDate={emitidoEm}
          razaoSocial={razaoSocial}
        />

        <SecaoManual
          numero="6"
          titulo="Comprovantes"
          intro="Cada parcela paga pode ter 1 comprovante anexado (PDF ou imagem). O arquivo fica armazenado de forma segura no Supabase Storage."
          passos={[
            {
              titulo: "Anexar",
              descricao:
                "Cessão → parcela paga sem 📎 → botão Anexar. Aceita PDF, JPG, PNG, WEBP, HEIC. Máx. 5 MB.",
            },
            {
              titulo: "Ver",
              descricao:
                "Botão Ver gera um link temporário (5 minutos). Abre numa aba nova. Não dá pra repassar esse link — quem precisa ver deve abrir no painel.",
            },
            {
              titulo: "Substituir",
              descricao:
                "Botão Substituir apaga o anterior e sobe o novo numa só ação.",
            },
            {
              titulo: "Remover",
              descricao:
                "Pra apagar sem substituir: Substituir → cancela. Ou abra a página da parcela diretamente. O pagamento permanece, só o anexo some.",
            },
          ]}
        />

        <SecaoManual
          numero="7"
          titulo="Importar planilha mensal"
          intro="Quando o contador Gabriel manda a planilha atualizada, você re-importa. O fluxo abaixo é o mesmo todo mês — guarda esse passo a passo."
          passos={[
            {
              titulo: "Limpar importação anterior",
              descricao:
                "Vai em Clientes → Marcos André → botão vermelho Limpar importações (NN). Senha. Apagar tudo. Os cards zeram.",
            },
            {
              titulo: "Subir os HTMLs",
              descricao:
                "Menu do usuário (canto superior direito) → Importar planilha HTML. Escolhe o cliente. Sobe TODOS os HTMLs do .zip que o Gabriel mandou.",
            },
            {
              titulo: "Conferir o preview",
              descricao:
                "O sistema mostra todos os cessionários encontrados com valor inicial, recebido e nº de pagamentos. Aqui você decide o que importar.",
            },
            {
              titulo: "Desmarcar legados",
              descricao:
                "Use Ctrl+F do navegador pra achar e desmarcar cessões já consolidadas pelo contador (ex: Construjá → Arnone III). Lista atual: Clovis, Construjá, Arnone II, MP-BOLOVO, Pinguim, Coopermetal, EIG., Plastwin II, ARTPLAY.",
            },
            {
              titulo: "Confirmar e importar",
              descricao:
                "Botão dourado no rodapé. Aguarda a tela verde de Importação concluída com a contagem de cessionários, cessões e pagamentos.",
            },
            {
              titulo: "Validar com o Resumo Geral",
              descricao:
                "Volta no cliente e confere se Volume Total e Recebido batem (com ~3% de diferença esperada por causa de juros/multas que o contador não soma no resumo).",
            },
          ]}
          dica="Se o resultado vier muito diferente do esperado, NÃO confirme. Volte ao preview, revise os marcados/desmarcados e tente de novo. A importação é destrutiva (pra evitar duplicação) — sempre limpe antes."
        />

        <PdfFooter
          legenda="Manual de uso — Painel Financeiro"
          contato="Sistema proprietário"
        />
      </Page>

      {/* SEÇÃO 8-9 — PERMISSÕES E DICAS */}
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader
          reportTitle="Manual de uso"
          reportDate={emitidoEm}
          razaoSocial={razaoSocial}
        />

        <View style={styles.secao}>
          <View style={styles.secaoHeader}>
            <Text style={styles.secaoNumero}>8</Text>
            <Text style={styles.secaoTitulo}>Quem pode fazer o quê</Text>
          </View>
          <Text style={styles.intro}>
            O sistema tem três perfis. Quando criar usuário em Admin → Usuários,
            escolha o perfil certo:
          </Text>

          <View style={styles.tabela}>
            <View style={styles.tabelaHeader}>
              <Text style={[styles.tabelaCelula, { flex: 1.2 }]}>O que faz</Text>
              <Text style={[styles.tabelaCelula, { flex: 1, textAlign: "center" }]}>
                Admin
              </Text>
              <Text style={[styles.tabelaCelula, { flex: 1, textAlign: "center" }]}>
                Financeiro
              </Text>
              <Text style={[styles.tabelaCelula, { flex: 1, textAlign: "center" }]}>
                Contador
              </Text>
            </View>
            <LinhaPermissao acao="Cadastrar/editar clientes e cessões" a="✓" f="✓" c="—" />
            <LinhaPermissao acao="Registrar pagamentos / estornar" a="✓" f="✓" c="—" />
            <LinhaPermissao acao="Anexar / ver comprovantes" a="✓" f="✓" c="ver" alt />
            <LinhaPermissao acao="Importar planilha do contador" a="✓" f="—" c="—" />
            <LinhaPermissao acao="Criar / editar usuários" a="✓" f="—" c="—" alt />
            <LinhaPermissao acao="Acessar área Admin" a="✓" f="—" c="—" />
            <LinhaPermissao acao="Ver relatórios via portal externo" a="—" f="—" c="✓" alt />
          </View>

          <View style={styles.dica}>
            <Text style={styles.dicaLabel}>Importante</Text>
            <Text style={styles.dicaTexto}>
              Para o contador (Gabriel) acompanhar de fora, gere um link de portal
              em Admin → Portal do contador. Ele vê os dados em modo leitura sem
              precisar de login.
            </Text>
          </View>
        </View>

        <SecaoManual
          numero="9"
          titulo="Atalhos e dicas práticas"
          passos={[
            {
              titulo: "Busca rápida",
              descricao:
                "Em qualquer página, aperta Ctrl+K (ou clica em Buscar no topo) pra ir direto a um cliente, cessionário ou cessão pelo nome.",
            },
            {
              titulo: "Tema escuro/claro",
              descricao:
                "Ícone de lua/sol no topo direito. Salvo por usuário.",
            },
            {
              titulo: "Inadimplência",
              descricao:
                "No painel inicial e na página do cliente, qualquer parcela vencida aparece com aviso amarelo/vermelho. Use isso pra cobrança proativa.",
            },
            {
              titulo: "Notificações",
              descricao:
                "Sino no topo direito mostra parcelas vencendo nos próximos 7 dias e cessões liquidadas.",
            },
            {
              titulo: "Esqueceu a senha",
              descricao:
                "Tela de login → Esqueci a senha. Recebe link por e-mail pra resetar.",
            },
          ]}
        />

        <View style={styles.callout}>
          <Text style={styles.calloutTitulo}>Em caso de dúvida</Text>
          <Text style={styles.calloutTexto}>
            Sempre que algo não fizer sentido (valor estranho, parcela sumiu,
            comprovante não abre), NÃO apague nada. Tira print da tela e fala
            com o suporte. O sistema preserva o histórico — quase sempre dá pra
            entender o que aconteceu sem perder dado nenhum.
          </Text>
        </View>

        <PdfFooter
          legenda="Manual de uso — Painel Financeiro"
          contato="Sistema proprietário"
        />
      </Page>
    </Document>
  );
}

function IndiceItem({ n, t }: { n: string; t: string }) {
  return (
    <View style={styles.indiceItem}>
      <Text style={styles.indiceNum}>{n}</Text>
      <Text style={styles.indiceTexto}>{t}</Text>
    </View>
  );
}

function ConceitoItem({ nome, desc }: { nome: string; desc: string }) {
  return (
    <View style={styles.conceito}>
      <Text style={styles.conceitoNome}>{nome}</Text>
      <Text style={styles.conceitoDesc}>{desc}</Text>
    </View>
  );
}

function LinhaPermissao({
  acao,
  a,
  f,
  c,
  alt = false,
}: {
  acao: string;
  a: string;
  f: string;
  c: string;
  alt?: boolean;
}) {
  return (
    <View
      style={[
        styles.tabelaLinha,
        alt ? { backgroundColor: PDF_COLORS.surface } : {},
      ]}
    >
      <Text style={[styles.tabelaCelula, { flex: 1.2 }]}>{acao}</Text>
      <Text
        style={[
          styles.tabelaCelula,
          { flex: 1, textAlign: "center", color: marcarCor(a) },
        ]}
      >
        {a}
      </Text>
      <Text
        style={[
          styles.tabelaCelula,
          { flex: 1, textAlign: "center", color: marcarCor(f) },
        ]}
      >
        {f}
      </Text>
      <Text
        style={[
          styles.tabelaCelula,
          { flex: 1, textAlign: "center", color: marcarCor(c) },
        ]}
      >
        {c}
      </Text>
    </View>
  );
}

function marcarCor(v: string): string {
  if (v === "✓") return PDF_COLORS.success;
  if (v === "—") return PDF_COLORS.textMuted;
  return PDF_COLORS.text;
}

const styles = StyleSheet.create({
  indice: {
    backgroundColor: PDF_COLORS.surface,
    padding: 16,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.gold,
  },
  indiceTitulo: {
    fontSize: 8,
    color: PDF_COLORS.textMuted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  indiceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  indiceNum: {
    width: 24,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.gold,
  },
  indiceTexto: {
    fontSize: 11,
    color: PDF_COLORS.navy,
  },
  callout: {
    marginTop: 18,
    padding: 12,
    backgroundColor: PDF_COLORS.navy,
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.gold,
  },
  calloutTitulo: {
    fontSize: 8,
    color: PDF_COLORS.gold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  calloutTexto: {
    fontSize: 10,
    color: PDF_COLORS.white,
    lineHeight: 1.5,
  },
  secao: { marginBottom: 16 },
  secaoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 2,
    borderBottomColor: PDF_COLORS.gold,
  },
  secaoNumero: {
    width: 28,
    height: 28,
    backgroundColor: PDF_COLORS.navy,
    color: PDF_COLORS.gold,
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
    textAlign: "center",
    paddingTop: 6,
    marginRight: 10,
  },
  secaoTitulo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.navy,
  },
  intro: {
    fontSize: 10,
    color: PDF_COLORS.textMuted,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  passo: {
    flexDirection: "row",
    marginBottom: 8,
  },
  passoNumero: {
    width: 18,
    height: 18,
    backgroundColor: PDF_COLORS.gold,
    color: PDF_COLORS.navy,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    textAlign: "center",
    paddingTop: 4,
    marginRight: 8,
    marginTop: 1,
  },
  passoNumeroText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  passoTexto: { flex: 1 },
  passoTitulo: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.navy,
    marginBottom: 2,
  },
  passoDesc: {
    fontSize: 9.5,
    color: PDF_COLORS.text,
    lineHeight: 1.5,
  },
  dica: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#fef3c7",
    borderLeftWidth: 3,
    borderLeftColor: PDF_COLORS.gold,
  },
  dicaLabel: {
    fontSize: 7,
    color: PDF_COLORS.goldDark,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  dicaTexto: {
    fontSize: 9.5,
    color: PDF_COLORS.text,
    lineHeight: 1.5,
  },
  conceito: {
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: PDF_COLORS.gold,
  },
  conceitoNome: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: PDF_COLORS.navy,
    marginBottom: 2,
  },
  conceitoDesc: {
    fontSize: 9.5,
    color: PDF_COLORS.text,
    lineHeight: 1.5,
  },
  tabela: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: PDF_COLORS.divider,
  },
  tabelaHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.navy,
  },
  tabelaLinha: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.divider,
  },
  tabelaCelula: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    fontSize: 9,
  },
});
