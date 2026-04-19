import { z } from "zod";

export const registrarPagamentoSchema = z.object({
  pagamento_id: z.string().uuid(),
  data_pagamento: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  valor: z.coerce.number().positive("Valor deve ser maior que zero").optional(),
  observacoes: z.string().trim().optional().or(z.literal("")),
});

export type RegistrarPagamentoInput = z.infer<
  typeof registrarPagamentoSchema
>;

export const estornarPagamentoSchema = z.object({
  pagamento_id: z.string().uuid(),
  motivo: z
    .string()
    .trim()
    .min(5, "Descreva o motivo do estorno (mínimo 5 caracteres)"),
});

export type EstornarPagamentoInput = z.infer<typeof estornarPagamentoSchema>;
