import { z } from "zod";

export const cessaoSchema = z
  .object({
    numero_contrato: z
      .string()
      .trim()
      .min(1, "Informe o número do contrato"),
    cliente_principal_id: z.string().uuid("Selecione um cliente"),
    cessionario_id: z.string().uuid("Selecione um cessionário"),
    valor_total: z.coerce
      .number()
      .positive("Valor total deve ser maior que zero"),
    parcelas_total: z.coerce
      .number()
      .int()
      .min(1, "Mínimo 1 parcela")
      .max(360, "Máximo 360 parcelas"),
    data_cessao: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    data_vencimento_inicial: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    taxa_juros: z.coerce
      .number()
      .min(0)
      .max(50, "Taxa muito alta")
      .optional()
      .default(0),
    observacoes: z.string().trim().optional().or(z.literal("")),
  })
  .refine(
    (data) => data.data_vencimento_inicial >= data.data_cessao,
    {
      message: "Vencimento inicial não pode ser antes da data de cessão",
      path: ["data_vencimento_inicial"],
    },
  );

export type CessaoInput = z.infer<typeof cessaoSchema>;
