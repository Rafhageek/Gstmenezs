import { z } from "zod";
import { digits, isDocumentoValido } from "@/lib/format";

const bancoSchema = z
  .object({
    banco: z.string().optional(),
    agencia: z.string().optional(),
    conta: z.string().optional(),
    tipo: z.enum(["corrente", "poupanca"]).optional(),
    pix: z.string().optional(),
  })
  .optional();

export const cessionarioSchema = z.object({
  nome: z.string().trim().min(3, "Nome muito curto"),
  documento: z
    .string()
    .trim()
    .transform((v) => digits(v))
    .refine(isDocumentoValido, "CPF ou CNPJ inválido"),
  email: z
    .string()
    .trim()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  telefone: z
    .string()
    .trim()
    .transform((v) => digits(v))
    .refine(
      (v) => v.length === 0 || v.length === 10 || v.length === 11,
      "Telefone inválido",
    )
    .optional()
    .or(z.literal("")),
  banco: bancoSchema,
  observacoes: z.string().trim().optional().or(z.literal("")),
  ativo: z.boolean().optional().default(true),
});

export type CessionarioInput = z.infer<typeof cessionarioSchema>;
