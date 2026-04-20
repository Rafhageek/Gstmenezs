# Guia de cadastro — Cliente Marcos André de Andrade

Este guia mostra como cadastrar manualmente pela UI o cliente real
**Marcos André de Andrade** e suas cessões de 2026 no Painel MNZ.

> **Pré-requisito:** a migration `0013_cessionarios_campos_extras.sql`
> precisa estar aplicada no Supabase para que os campos novos
> (tipo_pessoa, data_contrato, valor_contratado, valor_cessao, percentual)
> apareçam no formulário.

---

## 1. Login

1. Acesse https://painelmnz.vercel.app/login
2. Faça login com o usuário admin (contato@menezesadvocacia.com)
3. Responda a pergunta de segurança (2FA)

---

## 2. Cadastrar o cliente principal

**Menu:** Cadastros → Clientes → botão **+ Novo cliente**

URL direta: https://painelmnz.vercel.app/dashboard/clientes/novo

| Campo         | O que preencher                                    |
| ------------- | -------------------------------------------------- |
| Nome completo | Marcos André de Andrade                            |
| CPF           | (CPF real — 11 dígitos)                            |
| E-mail        | (e-mail do cliente, se houver)                     |
| Telefone      | (celular com DDD)                                  |
| Endereço      | Logradouro, número, bairro, cidade, UF, CEP        |
| Observações   | (notas internas, se houver)                        |
| Ativo         | ✓ marcado                                           |

Clique em **Cadastrar cliente**.

---

## 3. Cadastrar o(s) cessionário(s)

Para cada pessoa/empresa que adquiriu uma cessão de crédito do Marcos,
crie um cessionário separado.

**Menu:** Cadastros → Cessionários → **+ Novo cessionário**

URL direta: https://painelmnz.vercel.app/dashboard/cessionarios/novo

### 3.1 Tipo de pessoa (radio no topo do form)

- **Pessoa Jurídica (CNPJ)** — para empresas
- **Pessoa Física (CPF)** — para pessoas físicas

### 3.2 Identificação

| Campo              | O que preencher                                 |
| ------------------ | ----------------------------------------------- |
| Nome / Razão social| Nome completo ou razão social da empresa        |
| CPF ou CNPJ        | Documento (11 ou 14 dígitos, com máscara)       |
| E-mail             | E-mail de contato                               |
| Telefone           | Com DDD                                         |

### 3.3 Dados do contrato ⭐ (campos novos)

| Campo              | O que preencher                                        |
| ------------------ | ------------------------------------------------------ |
| Data do contrato   | Data em que o contrato de cessão foi assinado          |
| Valor contratado   | Valor original do crédito (ex: R$ 120.000,00)          |
| Valor da cessão    | Valor efetivamente pago pela cessão (ex: R$ 108.000,00)|
| Percentual         | % do crédito cedido (0 a 100) — ex: 30                 |

> **Sobre o percentual:** é quanto do crédito o cedente (Marcos)
> transferiu para este cessionário. Ex.: 30 significa que o cessionário
> tem direito a 30% dos recebíveis.

### 3.4 Dados bancários (para repasse)

Banco, agência, conta, tipo (corrente/poupança), chave PIX.

### 3.5 Observações

Qualquer anotação interna (não aparece para o cliente/contador).

Clique em **Cadastrar cessionário**.

> **Repita o processo 3** para cada cessionário envolvido nas
> cessões de 2026 do Marcos.

---

## 4. Cadastrar a(s) cessão(ões) de 2026

**Menu:** Operação → Cessões → **+ Nova cessão**

URL direta: https://painelmnz.vercel.app/dashboard/cessoes/nova

### 4.1 Dados da cessão

| Campo                  | O que preencher                                      |
| ---------------------- | ---------------------------------------------------- |
| Número do contrato     | Ex: MARCOS-001/2026 (único — não pode repetir)       |
| Cliente principal      | **Marcos André de Andrade** (combobox)               |
| Cessionário            | Selecione o cessionário já cadastrado no passo 3     |
| Valor total            | Valor total do crédito objeto da cessão              |
| Número de parcelas     | Quantas parcelas (ex: 12, 24, 36)                    |
| Data da cessão         | Data em que a cessão foi firmada                     |
| Data do 1º vencimento  | Quando vence a primeira parcela                      |
| Taxa de juros (%)      | % ao mês (deixe 0 se não houver)                     |
| Percentual cedido (%)  | Mesmo valor que colocou no cessionário               |
| Observações            | Notas internas                                       |
| Documento (PDF)        | Upload da escritura/contrato (opcional)              |

Clique em **Cadastrar cessão**.

> **O sistema gera automaticamente todas as parcelas** conforme o
> número informado, espaçadas mensalmente a partir do 1º vencimento.

---

## 5. Conferir o resultado

### Dashboard
https://painelmnz.vercel.app/dashboard

- **Saldo a receber** mostra o total das cessões a receber
- **Valor a receber** mostra as parcelas vencidas
- **Sessões Liquidadas** (topo) começa vazio até alguma cessão ser quitada
- **Visão geral** (pizza) separa liquidadas vs a receber

### Lista de cessões
https://painelmnz.vercel.app/dashboard/cessoes

Abas: Todas · **A receber** · **Liquidadas** · Inadimplentes · Canceladas

### Detalhes do cessionário
Clicando em "Detalhes" em qualquer cessionário, você vê o card
**Dados do contrato** com os novos campos.

---

## 6. Registrar pagamento de uma parcela

Quando o cessionário pagar uma parcela:

1. Abra a cessão (Operação → Cessões → clicar no contrato)
2. Role até **Cronograma de pagamentos**
3. Clique em **Registrar pagamento** na parcela paga
4. Informe a data de pagamento e o valor (se diferente do previsto)
5. Faça upload do comprovante (PDF ou imagem)

Quando **todas as parcelas forem pagas**, a cessão muda automaticamente
de status para **Liquidada** e aparece no card "Sessões Liquidadas"
no topo do dashboard.

---

## Atalhos úteis

| Ação                                  | URL                                                   |
| ------------------------------------- | ----------------------------------------------------- |
| Novo cliente                          | `/dashboard/clientes/novo`                            |
| Novo cessionário                      | `/dashboard/cessionarios/novo`                        |
| Nova cessão                           | `/dashboard/cessoes/nova`                             |
| Listar apenas liquidadas              | `/dashboard/cessoes?filtro=liquidadas`                |
| Listar apenas a receber               | `/dashboard/cessoes?status=ativa`                     |
| Listar apenas inadimplentes           | `/dashboard/cessoes?status=inadimplente`              |
| Buscar por cliente/contrato           | `/dashboard/cessoes?q=MARCOS`                         |

---

## Dúvidas frequentes

**Esqueci o CPF/CNPJ na hora do cadastro — dá pra editar depois?**
Sim. Clique em **Editar** na lista de clientes/cessionários.

**Errei o valor da cessão — o que fazer?**
Se já tem pagamentos registrados, estorne-os primeiro (botão "Estornar").
Depois edite a cessão. O ideal é conferir antes de salvar.

**O cliente quer ver só o extrato dele — como compartilhar?**
Admin → Portal do Contador → gera link temporário com token.
O cliente acessa via link público sem precisar criar conta.

**Como exportar para planilha/CSV?**
Em qualquer listagem (cessões, pagamentos) há o botão **⬇ Exportar CSV**
no canto superior direito.
