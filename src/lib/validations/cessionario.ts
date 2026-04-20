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
  tipo_pessoa: z.enum(["PF", "PJ"]).optional().default("PJ"),
  data_contrato: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : null)),
  valor_contratado: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? n : null;
    }),
  valor_cessao: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      return Number.isFinite(n) && n >= 0 ? n : null;
    }),
  percentual: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
      if (!Number.isFinite(n)) return null;
      if (n < 0 || n > 100) return null;
      return n;
    }),
});

export type CessionarioInput = z.infer<typeof cessionarioSchema>;
