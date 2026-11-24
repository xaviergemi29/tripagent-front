import z from "zod";
import { publicBankAccountOutputSchema } from "@/shared/schemas/bank-account.schema";

/** Quita espacios y guiones de una CLABE o tarjeta ("012 180-…" → "012180…"). */
const stripAccountSeparators = (value: string): string => value.replace(/[\s-]/g, "");

/**
 * Formulario de una cuenta bancaria (Configuración → Agencia y "Configurar cuenta ahora" del
 * formulario de tours). Espejo de las reglas de `POST/PATCH /agencies/bank-accounts` en la API: si
 * cambias una, cámbiala también en `tripagent-api`. La CLABE y la tarjeta aceptan espacios y
 * guiones (así se copian de la app del banco) y se envían solo con dígitos.
 */
export const bankAccountFormSchema = z.object({
  bankName: z.string().trim().min(1, "El banco es obligatorio").max(100, "Máximo 100 caracteres"),
  accountHolder: z
    .string()
    .trim()
    .min(1, "El titular es obligatorio")
    .max(255, "Máximo 255 caracteres"),
  clabeNumber: z
    .string()
    .transform(stripAccountSeparators)
    .pipe(z.string().regex(/^\d{18}$/, "La CLABE debe contener exactamente 18 números")),
  // Opcional: vacío → null (sin tarjeta).
  cardNumber: z
    .string()
    .transform(stripAccountSeparators)
    .pipe(z.string().regex(/^(\d{16})?$/, "El número de tarjeta debe tener exactamente 16 dígitos"))
    .transform((value) => value || null),
});

/** Cuenta de `GET /agencies/bank-accounts` (y `bankAccounts` de `GET /agencies`), por `position`. */
export const bankAccountOutputSchema = publicBankAccountOutputSchema.extend({
  id: z.uuid(),
  position: z.number().int(),
});

export type BankAccountFormInput = z.input<typeof bankAccountFormSchema>;
/** Cuerpo de `POST /agencies/bank-accounts` y `PATCH /agencies/bank-accounts/:id`. */
export type BankAccountInput = z.output<typeof bankAccountFormSchema>;
export type BankAccountOutput = z.output<typeof bankAccountOutputSchema>;
