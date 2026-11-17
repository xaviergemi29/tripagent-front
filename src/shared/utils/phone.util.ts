import {
  getCountries,
  getCountryCallingCode,
  isSupportedCountry,
  parsePhoneNumberFromString,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Teléfonos internacionales (2026-11-16), espejo de `tripagent-api/src/shared/utils/phone.util.ts`
 * (misma librería y metadatos "min", así el front y la API validan igual).
 *
 * Conceptos que no se deben mezclar:
 * - **País del número** (`CountryCode`, ISO alfa-2: MX, US, CA…): el que se elige en el selector.
 *   No es la nacionalidad ni la residencia del viajero. +1 lo comparten EE. UU., Canadá y otros, por
 *   eso se guarda el país y no solo la lada.
 * - **Lada** (calling code, "52"): sale del país.
 * - **Número nacional**: lo que se escribe en el campo ("2281234567").
 * - **E.164** ("+522281234567"): número completo normalizado. Es lo que se envía a la API, se guarda y
 *   se usa en WhatsApp y `tel:`.
 *
 * Registros anteriores pueden traer solo 10 dígitos: se interpretan como mexicanos (lo que el sistema
 * siempre hizo) y su país llega como `null` ("lada sin confirmar").
 */

export type PhoneCountry = CountryCode;

/** País inicial cuando no hay otro dato (las agencias operan en México). */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry = "MX";

/** Países que se muestran primero en el selector (los más frecuentes para las agencias). */
const PRIORITY_COUNTRIES: PhoneCountry[] = ["MX", "US", "CA"];

export interface PhoneCountryOption {
  code: PhoneCountry;
  name: string;
  callingCode: string;
  flag: string;
}

/** Bandera emoji a partir del ISO (en Windows se ve como las dos letras, que también sirve). */
export const getCountryFlag = (code: string): string =>
  String.fromCodePoint(...[...code.toUpperCase()].map((char) => 127397 + char.charCodeAt(0)));

let regionNames: Intl.DisplayNames | null = null;
/** Nombre del país en español ("México", "Estados Unidos"); el ISO si el navegador no lo conoce. */
export function getCountryName(code: PhoneCountry): string {
  try {
    regionNames ??= new Intl.DisplayNames(["es-MX", "es"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

/** "México (+52)". */
export const getPhoneCountryLabel = (code: PhoneCountry): string =>
  `${getCountryName(code)} (+${getCountryCallingCode(code)})`;

let countryOptions: PhoneCountryOption[] | null = null;
/**
 * Catálogo completo de países con lada (de los metadatos de libphonenumber, no escrito a mano):
 * primero México, EE. UU. y Canadá, después el resto en orden alfabético en español.
 */
export function getPhoneCountryOptions(): PhoneCountryOption[] {
  if (countryOptions) return countryOptions;
  const toOption = (code: PhoneCountry): PhoneCountryOption => ({
    code,
    name: getCountryName(code),
    callingCode: getCountryCallingCode(code),
    flag: getCountryFlag(code),
  });
  const rest = getCountries()
    .filter((code) => !PRIORITY_COUNTRIES.includes(code))
    .map(toOption)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  countryOptions = [...PRIORITY_COUNTRIES.map(toOption), ...rest];
  return countryOptions;
}

/** `true` si es un ISO alfa-2 con lada conocida. */
export const isPhoneCountry = (value: unknown): value is PhoneCountry =>
  typeof value === "string" && isSupportedCountry(value);

/**
 * Número capturado (nacional del país, o con "+" si se pegó completo) → E.164, o `null` si no es
 * válido para ese país.
 */
export function toE164(value: string | null | undefined, country: PhoneCountry): string | null {
  const text = (value ?? "").trim();
  if (!text) return null;
  const parsed = text.startsWith("+")
    ? parsePhoneNumberFromString(`+${text.replace(/\D/g, "")}`)
    : parsePhoneNumberFromString(text.replace(/\D/g, ""), country);
  if (!parsed?.isValid()) return null;
  if (parsed.countryCallingCode !== getCountryCallingCode(country)) return null;
  return parsed.number;
}

/**
 * Teléfono guardado (E.164 o los 10 dígitos anteriores) → país y número nacional para precargar un
 * formulario. El país guardado manda (distingue +1 EE. UU. / Canadá); sin él se deduce del número y,
 * en un registro anterior, es México. `confirmed` es falso si la lada se infirió.
 */
export function parseStoredPhone(
  value: string | null | undefined,
  storedCountry?: string | null,
  fallbackCountry: PhoneCountry = DEFAULT_PHONE_COUNTRY,
): { country: PhoneCountry; nationalNumber: string; confirmed: boolean } {
  const text = (value ?? "").trim();
  const known = isPhoneCountry(storedCountry) ? storedCountry : null;
  if (!text) return { country: known ?? fallbackCountry, nationalNumber: "", confirmed: true };

  if (text.startsWith("+")) {
    const parsed = parsePhoneNumberFromString(text);
    if (parsed) {
      const country =
        known && getCountryCallingCode(known) === parsed.countryCallingCode
          ? known
          : (parsed.country ?? known ?? fallbackCountry);
      return { country, nationalNumber: parsed.nationalNumber, confirmed: Boolean(known) };
    }
  }
  const digits = text.replace(/\D/g, "");
  return {
    country: known ?? DEFAULT_PHONE_COUNTRY,
    nationalNumber: digits.length === 10 ? digits : digits.slice(-10),
    confirmed: Boolean(known),
  };
}

/** País de un teléfono guardado (para elegir el país inicial de otro campo, p. ej. la agencia). */
export const getStoredPhoneCountry = (
  value: string | null | undefined,
  storedCountry?: string | null,
): PhoneCountry => parseStoredPhone(value, storedCountry).country;

/**
 * Lo que se escribe o pega en el campo → país y número nacional, sin duplicar la lada:
 * - "+34 612 345 678" o "0034…" cambia el país a España y deja "612345678";
 * - "52 228 123 4567" con México seleccionado quita la lada repetida;
 * - un "+" aún incompleto se conserva para que se pueda seguir escribiendo.
 */
export function normalizePhoneInput(
  raw: string,
  country: PhoneCountry,
): { country: PhoneCountry; value: string } {
  const text = raw.trim();
  const digits = text.replace(/\D/g, "");
  const isInternational = text.startsWith("+") || text.startsWith("00");

  if (isInternational) {
    const international = text.startsWith("00") ? digits.slice(2) : digits;
    const parsed = parsePhoneNumberFromString(`+${international}`);
    if (parsed?.isPossible()) {
      const sameCode = getCountryCallingCode(country) === parsed.countryCallingCode;
      const detected = parsed.country ?? (sameCode ? country : undefined);
      if (detected) return { country: detected, value: parsed.nationalNumber };
    }
    return { country, value: `+${international}`.slice(0, 18) };
  }

  // Lada del país seleccionado escrita sin "+" ("52 228…"): la librería la reconoce al tener el
  // número completo; se deja solo el número nacional.
  const callingCode = getCountryCallingCode(country);
  if (digits.startsWith(callingCode)) {
    const parsed = parsePhoneNumberFromString(digits, country);
    if (
      parsed?.isValid() &&
      parsed.countryCallingCode === callingCode &&
      parsed.nationalNumber !== digits
    ) {
      return { country, value: parsed.nationalNumber };
    }
  }
  return { country, value: digits.slice(0, 17) };
}

/**
 * Teléfono para mostrar. México en formato nacional ("228 123 4567", como siempre se ha mostrado y
 * como imprime el estado de cuenta); otros países en formato internacional ("+1 212 555 1234").
 * Un valor que no se reconoce se devuelve tal cual.
 */
export function formatPhoneForDisplay(phone?: string | null): string {
  const text = (phone ?? "").trim();
  if (!text) return "";
  const digits = text.replace(/\D/g, "");
  const parsed = text.startsWith("+")
    ? parsePhoneNumberFromString(`+${digits}`)
    : digits.length === 10
      ? parsePhoneNumberFromString(digits, DEFAULT_PHONE_COUNTRY)
      : undefined;
  if (!parsed) return text;
  if (parsed.countryCallingCode === getCountryCallingCode(DEFAULT_PHONE_COUNTRY)) {
    const national = parsed.nationalNumber;
    if (national.length !== 10) return parsed.formatInternational();
    return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  }
  return parsed.formatInternational();
}

/**
 * Dígitos internacionales para `wa.me` y `tel:` (sin "+"): un E.164 se usa tal cual; un registro
 * anterior de 10 dígitos lleva la lada 52 (era México); cualquier otro valor se deja en dígitos.
 */
export function toInternationalDigits(phone?: string | null): string {
  const text = (phone ?? "").trim();
  const digits = text.replace(/\D/g, "");
  if (!digits) return "";
  if (text.startsWith("+")) return digits;
  return digits.length === 10 ? `${getCountryCallingCode(DEFAULT_PHONE_COUNTRY)}${digits}` : digits;
}

/** Enlace `tel:` con el número internacional (o `undefined` si no hay número). */
export const buildTelUrl = (phone?: string | null): string | undefined => {
  const digits = toInternationalDigits(phone);
  return digits ? `tel:+${digits}` : undefined;
};

/** Compara dos teléfonos en cualquier formato (E.164 o los 10 dígitos anteriores). */
export const isSamePhone = (a?: string | null, b?: string | null): boolean => {
  const left = toInternationalDigits(a);
  return left !== "" && left === toInternationalDigits(b);
};
