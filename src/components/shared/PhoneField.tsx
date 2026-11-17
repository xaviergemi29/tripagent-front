"use client";

import { useId, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";
import { Popover } from "radix-ui";
import { Check, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { normalizeSearchText } from "@/shared/utils/search.util";
import {
  DEFAULT_PHONE_COUNTRY,
  isPhoneCountry,
  getCountryFlag,
  getPhoneCountryLabel,
  getPhoneCountryOptions,
  normalizePhoneInput,
  type PhoneCountry,
  type PhoneCountryOption,
} from "@/shared/utils/phone.util";
import { getCountryCallingCode } from "libphonenumber-js";

interface PhoneFieldProps {
  /** `register("whatsapp")` del número nacional. */
  registration: UseFormRegisterReturn;
  /** País seleccionado (campo `*Country` del formulario); vacío o desconocido → México. */
  country: PhoneCountry | null | undefined;
  /** Cambio de país, desde el selector o al pegar un número con "+lada". */
  onCountryChange: (country: PhoneCountry) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  /** Clases del campo del número (altura, colores…); el selector toma la misma altura. */
  inputClassName?: string;
  className?: string;
  /** Se llama después del `onBlur` de react-hook-form (p. ej. para buscar al viajero). */
  onBlur?: (value: string) => void;
  /** Texto accesible del campo del número (si no hay `<Label htmlFor>`). */
  "aria-label"?: string;
}

/**
 * Campo de teléfono internacional (2026-11-16): selector de país con bandera, nombre y lada (con
 * búsqueda por nombre, ISO o lada) + número nacional. Es la única forma de capturar teléfonos.
 *
 * - El número se guarda en el formulario como se escribe; al pegar "+34 612…" o "0034…" cambia el
 *   país y deja solo el número nacional, así la lada nunca se duplica (`normalizePhoneInput`).
 * - La validación (`refinePhone`) y la conversión a E.164 (`toE164`) las hace el schema del formulario.
 * - La lista se dibuja sin portal: dentro de un Dialog/Sheet de Radix, un portal no recibe el scroll.
 */
export function PhoneField({
  registration,
  country: countryProp,
  onCountryChange,
  id,
  placeholder,
  disabled,
  invalid,
  inputClassName,
  className,
  onBlur,
  "aria-label": ariaLabel,
}: PhoneFieldProps) {
  // Mientras el formulario carga sus valores, el país puede llegar vacío.
  const country = isPhoneCountry(countryProp) ? countryProp : DEFAULT_PHONE_COUNTRY;
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const next = normalizePhoneInput(event.target.value, country);
    if (next.country !== country) onCountryChange(next.country);
    event.target.value = next.value;
    void registration.onChange(event);
  };

  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <CountrySelect value={country} onChange={onCountryChange} disabled={disabled} />
      <Input
        {...registration}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        maxLength={20}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-label={ariaLabel}
        onChange={handleChange}
        onBlur={(event) => {
          void registration.onBlur(event);
          onBlur?.(event.target.value);
        }}
        className={cn("min-w-0 flex-1", inputClassName)}
      />
    </div>
  );
}

interface CountrySelectProps {
  value: PhoneCountry;
  onChange: (country: PhoneCountry) => void;
  disabled?: boolean;
}

/** Busca por nombre sin acentos ("mexico"), ISO ("es") o lada ("+1", "34"). */
function matchesCountry(option: PhoneCountryOption, query: string): boolean {
  const text = normalizeSearchText(query).replace(/^\+/, "");
  if (!text) return true;
  return (
    normalizeSearchText(option.name).includes(text) ||
    option.code.toLowerCase() === text ||
    option.callingCode.startsWith(text)
  );
}

function CountrySelect({ value, onChange, disabled }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();

  const options = getPhoneCountryOptions().filter((option) => matchesCountry(option, query));

  const handleOpenChange = (next: boolean): void => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setActiveIndex(0);
    }
  };

  const select = (code: PhoneCountry): void => {
    onChange(code);
    handleOpenChange(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, options.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) select(option.code);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger
        type="button"
        disabled={disabled}
        aria-label={`País del teléfono: ${getPhoneCountryLabel(value)}`}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex shrink-0 items-center gap-1 rounded-lg border bg-transparent px-2.5 text-sm font-medium text-slate-700 transition-colors outline-none hover:bg-slate-50 focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden="true" className="text-base leading-none">
          {getCountryFlag(value)}
        </span>
        <span>+{getCountryCallingCode(value)}</span>
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
      </Popover.Trigger>
      <Popover.Content
        align="start"
        sideOffset={6}
        collisionPadding={16}
        className="z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
      >
        <div className="relative mb-2">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-slate-400"
          />
          <Input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar país o lada"
            aria-label="Buscar país o lada"
            aria-controls={listId}
            aria-activedescendant={
              options[activeIndex] ? `${listId}-${options[activeIndex].code}` : undefined
            }
            className="h-9 pl-8"
          />
        </div>
        <ul id={listId} role="listbox" aria-label="Países" className="max-h-64 overflow-y-auto">
          {options.length === 0 && (
            <li className="px-2 py-3 text-center text-sm text-slate-500">Sin resultados</li>
          )}
          {options.map((option, index) => (
            <li
              key={option.code}
              id={`${listId}-${option.code}`}
              role="option"
              aria-selected={option.code === value}
              onClick={() => select(option.code)}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm text-slate-700",
                index === activeIndex && "bg-slate-100",
              )}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {option.flag}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.name}</span>
              <span className="text-slate-500">+{option.callingCode}</span>
              {option.code === value && (
                <Check aria-hidden="true" className="h-4 w-4 text-indigo-600" />
              )}
            </li>
          ))}
        </ul>
      </Popover.Content>
    </Popover.Root>
  );
}
