import z from "zod";

/**
 * Cuenta bancaria de la agencia tal como llega en los payloads públicos del Magic Link (sin `id` ni
 * `position`), ya ordenada por la API. Banco o titular pueden venir vacíos en registros migrados:
 * se muestran con `BANK_NAME_FALLBACK` / `ACCOUNT_HOLDER_FALLBACK`.
 */
export const publicBankAccountOutputSchema = z.object({
  bankName: z.string(),
  accountHolder: z.string(),
  clabeNumber: z.string(),
  cardNumber: z.string().nullable(),
});

export type PublicBankAccountOutput = z.output<typeof publicBankAccountOutputSchema>;
