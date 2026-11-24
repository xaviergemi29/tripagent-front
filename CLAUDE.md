@AGENTS.md

# tripagent-front — Reglas y patrones del frontend

> Contexto global (producto, contrato front-back, reglas de negocio numeradas, deuda) en `../CLAUDE.md`. Repo Git independiente: no hagas commit, push ni pull sin que el usuario lo pida.
> Este archivo contiene **solo reglas vigentes**. El historial (qué se corrigió, cuándo y por qué) está en `docs/historial-claude-front.md` y en `../reporte-mvp.md`: consúltalos solo si necesitas el motivo de una regla.
> **Next.js 16 rompe compatibilidad** (ver `AGENTS.md`): consulta `node_modules/next/dist/docs/` antes de usar una API de Next. El middleware es `src/proxy.ts` (exporta `proxy()`); `params` y `searchParams` son `Promise`.

## Stack

Next.js 16.4.5 (App Router, `reactCompiler: true`) · React 19.2.4 · TypeScript estricto (alias `@/*` → `src/*`) · TanStack Query 5 (`staleTime` 5 min, sin refetch al enfocar) · TanStack Table · axios (`apiClient`) · react-hook-form + Zod 4 · Tailwind 4 (tema en `globals.css`, sin `tailwind.config`) · shadcn (`radix-nova`) en `components/ui` · lucide, sonner · jsPDF + autotable · `libphonenumber-js` 1.13.15 exacta (misma que la API) · driver.js 1.10.2 exacta · Vitest + Testing Library + jsdom (compila con el React Compiler).

No agregues dependencias sin justificarlo; fija versiones con al menos dos semanas de antigüedad.

## Scripts y entorno

`npm run dev` (`-H 0.0.0.0 -p 3000`) · `lint` · `test:run` · `build` · `format` / `format:check` (Prettier 100 columnas). Tras cambiar un contrato: lint + test:run + build.

- `NEXT_PUBLIC_API_URL` (incluye `/api`; por defecto `http://localhost:3001/api`): se lee **solo** en `src/lib/api-config.ts` (`API_BASE_URL`).
- `NEXT_PUBLIC_SUPPORT_WHATSAPP` (opcional): solo en `src/lib/support-config.ts`; sin ella no se dibujan botones de soporte (nunca un número falso).
- `INTERNAL_PROXY_SECRET` (opcional, **de servidor**, nunca `NEXT_PUBLIC_`): mismo valor que en la API; `src/lib/forwarded-client-ip.ts` reenvía la IP del visitante en los fetch de servidor (`/s/[token]`, `/p/[id]`, `/register`). Requisitos de hosting: `../auditoria-seguridad-infraestructura.md` §E.

## Estructura

```
src/
├── proxy.ts                  # protege /tours*, /travelers*, /settings*, /pdf-tour* (solo verifica la cookie)
├── app/                      # SOLO enrutado y composición
│   ├── (auth)/login, (auth)/registro          # login; alta de agencia (pública)
│   ├── (marketing)/terminos, privacidad, contacto   # páginas públicas de TripAgent
│   ├── (dashboard)/tours, tours/new, tours/[id] (Centro de Control), tours/[id]/edit, travelers, settings
│   ├── register/             # Magic Link (Server Component, ?token=)
│   ├── p/[id]/               # folleto público (Server Component)
│   ├── s/[token]/            # enlace de staff de solo lectura (Server Component)
│   └── pdf-tour/[id]/        # lista de abordaje imprimible (croquis + lista por asiento + por punto)
├── features/<dominio>/{components,hooks,schemas,constants,utils}
│   auth · notifications · legal · tours · tour-dashboard (header, passengers, finance, seating, manifest, mobile)
│   statements (PDF) · travelers · external-registration (Magic Link) · public-tours (folleto)
│   staff-share · settings (agency, branding, subscription) · onboarding (driver.js) · vehicles (croquis genérico)
├── components/{ui (shadcn), layout (Sidebar, Header, public/), shared}
├── lib/{api-client, api-config, api-error, support-config, forwarded-client-ip, utils}
└── shared/{api (query-keys, invalidate-booking-change, fetch-all-pages), constants/domain.constants, schemas, utils, utils/config}
```

Sin carpetas `mocks/`: los datos de prueba viven en cada `__tests__/`.

## Arquitectura

- `app/` solo compone; lógica y UI en `features/`. Componentes de presentación por props; contenedores con hooks.
- `shared/`, `components/` y `lib/` **no importan de `features/`**. Una feature puede usar otra **sin ciclos**; lo común va a `shared/` o a una feature propia (como `statements`).
- Cada hook vive en la feature cuya pantalla lo usa (las acciones del operador están en `tour-dashboard/hooks` aunque llamen a `/bookings`).
- Escritorio y celular: variantes dedicadas (`components/mobile/*`, `*MobileCardList`) que **comparten el estado** del contenedor (una sola `activeTab`, filtros con `useDashboardFilters`, acciones del grupo con `useTravelerGroupActions` + `TravelerGroupDialogs`). No dupliques `useState` por tamaño de pantalla.
- Server Component → Client Component: solo props serializables (nunca funciones). jsdom no detecta este error.
- `useSearchParams` exige `<Suspense>` (ver `settings/page.tsx`).

## Datos y caché (TanStack Query)

- Query keys **solo** desde `shared/api/query-keys.ts`; nunca declaradas en un hook.
- Red: `apiClient.get<never, T>(url)` (el segundo genérico es el tipo ya desenvuelto).
- `onSuccess`: invalidar + `toast.success`; `onError`: `toast.error(…, { description: error.message })` con `ApiError`.
- Optimista (`onMutate` / `cancelQueries` / `setQueriesData` / rollback) en asientos, viajeros y tours.
- **Mutaciones de reservas** (apartado, cancelar, agregar/liberar lugar, baja, transferir, abono, anulación, cancelar tour): `invalidateBookingChange(queryClient, tourId?)`. Toda mutación nueva de reservas debe usarla.
- `TOUR_DASHBOARD_KEYS` cuelga de `["tour-dashboard"]`, no de `["tours"]`: cualquier mutación que cambie algo visible en el Centro de Control (incluida la edición del tour) invalida `TOUR_DASHBOARD_KEYS.detail(tourId)`. `useUpdateTraveler` y `useDeleteTraveler` invalidan `TOUR_DASHBOARD_KEYS.all`.
- Listas paginadas (`/tours`, `/travelers`): `fetchAllPages` (el interceptor pierde `pagination`) y filtro en el cliente.

## Cliente HTTP (`lib/api-client.ts`)

- `withCredentials`, timeout 10 s; subidas de archivos con `timeout: UPLOAD_TIMEOUT_MS` (120 s).
- El interceptor devuelve `response.data?.data ?? response.data`.
- 401 (salvo `/auth/login`) → `location.replace("/login?expired=true")`. Logout también con navegación dura: nunca `router.push/replace` para salir de la sesión.
- Errores normalizados a `ApiError { status, message, code, issues, availableSeats }`. **No es `Error`**: usa `isApiError` / `isNotFoundError` (`lib/api-error.ts`), nunca `instanceof Error`. Para decidir qué mostrar compara `code` (p. ej. `CONFLICT_CODES`), nunca el texto.

## Páginas públicas

- Server Components con `fetch(\`${API_BASE_URL}/…\`, { cache: "no-store" })` directo (no `apiClient`), con `getForwardedClientIpHeaders()`; las interacciones van en Client Components hijos con `apiClient` + React Query.
- Cascarón `components/layout/public/` (`PublicBookingLayout`, header con `AgencyLogo`, píldora de estado, pie "Potenciado por TripAgent"). Server-safe.
- `/register` elige la vista con `FlowViews[flowState]`; errores de `validate` con `describeValidationError`. El Magic Link **no vence**.
- `/p/[id]`: CTA "Iniciar Reserva" (`PreBookingDialog`, decide con `error.code`: `CAPACITY_EXCEEDED`, `BOOKINGS_CLOSED`, `ALREADY_BOOKED`) y WhatsApp. `BrochureAvailability` con cuatro niveles. Sin búsqueda pública de WhatsApp.
- Metadata: plantilla `"%s · TripAgent"`, `lang="es-MX"`; páginas cliente ponen el título en un `layout.tsx` del segmento; `/register` y `/s` con `noindex`.

## Formularios (reglas del React Compiler)

- Datos de la API → opción `values` de `useForm` (+ `resetOptions: { keepDirtyValues: true }` si se puede estar editando). **Nunca** `useEffect(() => form.reset(data))`.
- `useFormState({ control })` **antes** de cualquier `return` temprano; nunca `form.formState` después de uno.
- `useWatch`, nunca `watch()` / `form.watch()` (un componente con `watch()` no se compila).
- Sin `useMemo` / `useCallback` manuales; sin `useEffect` + `setState` para derivar estado (calcúlalo en el render o ajusta estado durante el render).
- Formularios en diálogos: componente interno dentro de `DialogContent` (Radix lo desmonta al cerrar) para partir de `defaultValues`.
- Schemas en `features/<x>/schemas/*.schema.ts`; tipos con `z.infer` / `z.input` / `z.output`. Nombres: `XInput` (lo que se envía), `XFormInput` (formulario distinto del cuerpo), `XOutput` (respuestas); `xInputSchema` / `xOutputSchema`. Nunca `DTO`, `Payload`, `Body`, `Result`, `FormValues`.
- Los schemas del front **replican las reglas de la API**: si cambias una, cámbiala en ambos repos.
- Campos numéricos controlados: `NumericInput` (`components/shared`). `<input type="number">` nativo: `onWheel={blurNumberInputOnWheel}`.
- Campos con `id` + `<Label htmlFor>`; texto `text-base sm:text-sm` (evita el zoom de iOS).
- `PhoneField` con `autoComplete="off"` salvo el WhatsApp propio del titular, la pre-reserva y la agencia.

## Componentes y UI

- Estados: diccionarios de `shared/utils/config/status-dictionaries.config.ts` (`PAYMENT_STATUS_DICT`, `PAYMENT_METHOD_DICT`, `PASSENGER_ROLE_DICT`, …).
- **Enums de dominio:** nunca como texto. Tupla para Zod (`z.enum(CURRENCIES)`), tipo (`Currency`) y objeto para comparar (`PASSENGER_ROLE.TITULAR`), desde `shared/constants/domain.constants.ts`.
- Confirmaciones destructivas: `ConfirmDialog`. Drawers: `Sheet` de Radix (`side="right"`), nunca un `div` fijo.
- Logo de agencia: `AgencyLogo`. WhatsApp: `WhatsAppIcon` (nunca `MessageCircle` ni emojis).
- Colores de acciones de la fila de pasajeros: `ROW_ACTION_TONE` (`traveler-row-cells.tsx`), única definición.
- Botones de solo ícono con `aria-label`.
- Consulta fallida sin datos → `QueryErrorState` (sin texto técnico; `resourceName` + `resourceArticle`); con datos en caché se siguen mostrando. 404 real ≠ error (`isNotFoundError`).
- Componentes base: agrégalos con shadcn antes de crearlos a mano. Paleta `slate`/`indigo-600` + `emerald`/`amber`/`red` para estados; tarjetas `rounded-xl|2xl` con borde `slate-200`. Textos en español de México.

## Utilidades obligatorias

- **Importes:** `formatCurrency(value, { currency })` con la divisa real (`$1,000.00 MXN`). Nunca `toLocaleString`/`Intl.NumberFormat` ni el código concatenado a mano. El LTV se muestra por divisa (`lifetimeValueByCurrency`).
- **Fechas sin hora** (`YYYY-MM-DD`): `formatLocalDate`, `formatSpanishLongDate`, `parseDateOnly`; **nunca** `new Date(str)`. Hoy en CDMX: `getTodayInMexico`. Horas de abordaje: `formatPickupTime` (AM/PM); hora de salida: `getEarliestBoardingTime`. Relativo: `formatRelativeTime`.
- **Teléfonos** (E.164 + país): captura con `PhoneField` + `refinePhone` + `toE164`; precarga con `parseStoredPhone`; mostrar con `formatPhoneForDisplay`; `tel:` con `buildTelUrl`; `wa.me` **siempre** con `buildWhatsAppUrl` (pasa el número tal como está guardado; nunca antepongas la lada).
- **Enlaces:** `buildMagicLinkUrl`, `buildBrochureUrl`, `buildStaffShareUrl`, `buildApiPublicFileUrl` (archivos de la API en `<origen>/public/…`, sin `/api`) en `shared/utils/share-links.util.ts`.
- **Búsquedas:** `matchesSearch` (sin acentos ni mayúsculas; teléfonos por dígitos).
- Bancos: `formatClabeForDisplay` (3-3-11-1). Colores: `hexToRgb`. Portapapeles: `copyToClipboard`.

## Reglas que calcula la API (no recalcular en el front)

Derecho a asiento (`hasSeatRight`, `requiredDeposit`), estado de la reserva (`bookingStatus`), estado de pago, saldos, saldo a favor (`refundableSurplus`), retenciones, ocupación y capacidad vendible (`occupancy`, `availability`), `temporalStatus`, montos de reembolso (`refunds`), `isReadOnly` de la suscripción y `pendingDeposit` de las notificaciones. El front solo los muestra. Única excepción: vistas previas en formularios con espejos de la API (`summarizeCompanionDrop`, "Lugares disponibles para venta").

## Modos de solo consulta

- **Modo Auditoría** (tour FINALIZADO o CANCELADO): `TourDashboardView` apaga acciones sin pasar el callback (`onX={isAuditMode ? undefined : …}`); `SeatMapCanvas readOnly`; sin cambio de vehículo también EN CURSO con unidad (`canChangeVehicle`). Editar tour: `isTourReadOnly`. Excepción: reembolsos en CANCELADO.
- **Solo Lectura por suscripción:** `useSubscriptionAccess()` → usa **`canWrite`** para ocultar/deshabilitar (falso mientras carga). `isAuditMode` del Centro de Control ya lo incluye. `/tours/new` y `/tours/[id]/edit` en `WritableAccountGuard`. Banner `SubscriptionReadOnlyBanner` en el layout del panel. Contraseña y Suscripción siguen operativas.

## Funcionalidades: dónde está cada cosa

- **Centro de Control** (`TourDashboardView`): pestaña única; `focusBookingId` (`?bookingId=`) lleva a Pasajeros sin filtros, recarga el dashboard si la reserva no está en caché, hace scroll y resalta 4 s; al terminar quita el parámetro (`router.replace`). Asientos en vivo con `applyLiveSeats`.
- **Acciones del grupo:** agregar lugar, dar de baja (`RemovePassengerDialog`: retención 0…precio pactado con chips 0/25/50 %/Total a centavos, no se cierra mientras guarda; toast con `refundableSurplus` de la API), liberar lugar, transferir (`TransferPassengerModal`), cancelación total (`TravelerDetailDrawer`), "A devolver" + "Registrar devolución".
- **Abonos y reembolsos en USD** (`RegisterPaymentModal`, RB-PAG-004): pesos (`collectedAmount`) → tipo de cambio (≤ 4 decimales) → tarjeta USD (`amount`) con cálculo en vivo (`convertMxnToUsd`) y desglose de saldos; "Ajustar centavos" la vuelve editable; recalcula solo al cambiar pesos o TC (en el `onValueChange`, sin efectos). Subtítulo con `holderName`. Reglas en `buildPaymentFormSchema({ isUSD })`; MXN sin cambios.
- **Enviar por WhatsApp** (`SendBookingWhatsAppAction` + `shared/utils/booking-whatsapp.util.ts`): reservas `AWAITING_REGISTRATION`/`PENDING` con Magic Link; anticipo pendiente; banco solo con CLABE, sin tarjeta; `PENDING` = recordatorio de pago.
- **Notificaciones** (`NotificationCenter` en el `Header` global): polling 45 s + `refetchOnWindowFocus`/`refetchOnReconnect`; refetch con skeleton al abrir; botón directo "Enviar acceso por WhatsApp" en `PRE_BOOKING` accionables (campo vivo `booking`), oculto sin `canWrite`; el ítem tiene el área principal y el enlace como hermanos (nunca `<a>` dentro de `<button>`).
- **Hospedaje** (`tour-dashboard/components/lodging`, `lodging.util.ts`, `useLodging`, `lodging.schema.ts`): pestaña solo en tours de varios días (`tourHasLodgingNights`). `GET /lodging/:tourId` → `HotelEmptyState` o `LodgingBoard` (hotel activo, KPIs, `UnassignedSidebar`, `RoomGrid`/`RoomCard`); `RoomRegistrationModal` agrega lotes (con `initialHotelName` al hotel activo). Asignar/desasignar camas, número de cuarto inline y Confirmada son mutaciones optimistas de `useLodging` (la API decide capacidad y 409; un pasajero tiene una cama por hotel). Eliminar cama (`DELETE .../beds/:slotIndex`, baja `capacity` y recorre las siguientes; solo con `capacity > 1`) o habitación (`DELETE .../rooms/:roomId`) pasa por `DeleteBedModal`/`DeleteRoomModal` (base `DeleteLodgingDialog`, no cierran mientras eliminan); "camas" = `room.capacity`, nunca `slots.length`, y la habitación cambia al tipo de su nueva capacidad (1 `SINGLE` Individual, 2 Doble Individual, 3 Triple, 4 Cuádruple; igual capacidad que el tipo actual lo conserva; `resolveRoomTypeForCapacity`, espejo de la API, también en la actualización optimista; `getRoomDescription` solo añade "(N lugares)" con datos que no coincidan). Un hotel sin habitaciones sigue mostrando el tablero. Badge de la pestaña = `countLodgingPendingPassengers`. Sin teléfono, check-in ni fechas por hotel (la estancia es la del tour) ni IA. Con `readOnly` (Modo Auditoría o sin `canWrite`) solo se consulta y se copia el Rooming List (`buildRoomingListText`).
- **Lista de abordaje** (`/pdf-tour/[id]`): hoja 1 croquis (`ManifestSeatMap`, `VehicleLayoutGrid size="print"`) + leyenda P1…Pn; salto de página; hoja 2 lista por asiento (`ManifestSeatTable`); luego por punto. Lógica en `boarding-sheet.util.ts`. Sin datos financieros.
- **Pase de lista de abordaje** (`features/boarding`, RB-MAN-002): `BoardingList` presentacional (contador, búsqueda, filtros Faltan/Abordados/Todos, botón grande) con dos contenedores: `TourBoardingPanel` (pestaña "Abordaje" del Centro de Control; `readOnly = isAuditMode`) y `StaffBoardingPanel` (pestaña "Pase de lista" de `/s/[token]`, arranca con los datos del servidor). Marcas optimistas con rollback; polling de 15 s; el enlace identifica pasajeros con `boardingKey`, nunca ids.
- **Enlace de staff** (`/s/[token]`, `features/staff-share`, `StaffShareDialog`, `useStaffShare`): sin montos, teléfonos, correos ni contactos de emergencia (el schema los descarta). Oculto en Modo Auditoría; en Solo Lectura solo se comparte uno existente. Regla 26 de `../CLAUDE.md`.
- **Croquis:** `VehicleLayoutGrid` dibuja cualquier `layoutMap` (no hay componentes por modelo). `SeatMapCanvas` no dibuja sin asientos cargados. Capacidad siempre de `vehicle.capacity` (no cuentes celdas). `VehicleSelectionModal`: catálogo + unidades anteriores.
- **Estado de cuenta PDF** (`features/statements/pdf`): un solo generador para cliente (`buildMagicLinkStatement`) y operador (`downloadOperatorStatement`); recibe todo por props; **nunca imprime la tarjeta**; solo abonos válidos; `toPdfSafeText`.
- **Configuración:** pestañas `TAB_ITEMS`; Agencia (CLABE obligatoria, tarjeta opcional, separadores quitados antes de validar), Políticas (≤ `POLICIES_MAX_LENGTH`), Identidad visual, Seguridad, Suscripción (todo de `GET /agencies/subscription`; baja programada con `CancelSubscriptionDialog` y reactivar, solo `AGENCY_ROLE.ADMIN`; fechas de corte con `formatSubscriptionDate`).
- **Formulario de tour:** `buildTourFormSchema(originalDepartureDate, { agencyHasClabe })`; moneda y precio congelados con `hasPayments`; el folleto se sube después de guardar (si falla, no se duplica el tour); `BankAccountQuickModal` sin salir del formulario.
- **Magic Link (registro):** solo se bloquean los campos que llegaron guardados; acompañantes indexados por `field.id`; casilla única de declaración y aviso (`PoliciesCheckbox` + `PoliciesConsentModal`); **ningún campo de salud** (regla 25); `RegistrationFooter` con "Anticipo hoy".
- **Guías interactivas** (driver.js): pasos en `onboarding/constants/guided-tours.ts` con `data-tour={TOUR_TARGET.X}`; sube `version` para volver a mostrarlas.

## Rutas y sesión

- `PROTECTED_PREFIXES` del proxy y las rutas con `Cache-Control: no-store` de `next.config.ts` deben coincidir. Páginas públicas (`/registro`, `/terminos`, `/privacidad`, `/contacto`, `/register`, `/p`, `/s`) fuera de esa lista.
- Encabezados de seguridad en `next.config.ts` (`X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`); probados en `src/__tests__/next-config.security.test.ts`. `allowedDevOrigins` es la IP de la red local del desarrollador.
- Sesión: `useSession()` (`GET /auth/me`). Sin guarda de roles en la UI.

## Pruebas

- Junto al código en `__tests__/`. Todo formulario tiene al menos una prueba que llena, valida y envía.
- Las pruebas compilan con el React Compiler: un mock de un hook debe incluir todo lo que el componente importa (p. ej. `useIsSavingSeat` con `useTourSeats`, `useSubscriptionAccess` con `canWrite`).
- En jsdom, `NumericInput` se prueba con `fireEvent.change` y revisando `.value`.
- Server Components async: ver el patrón de `app/s/[token]/__tests__`.
