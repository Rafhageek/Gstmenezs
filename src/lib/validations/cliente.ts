import { z } from "zod";
import { digits, isDocumentoValido } from "@/lib/format";

const enderecoSchema = z
  .object({
    cep: z.string().optional(),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().length(2).optional().or(z.literal("")),
  })
  .optional();

export const clienteSchema = z.object({
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
  endereco: enderecoSchema,
  observacoes: z.string().trim().optional().or(z.literal("")),
  ativo: z.boolean().optional().default(true),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
