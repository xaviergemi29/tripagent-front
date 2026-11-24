"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch, FormProvider, type FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bus,
  CalendarRange,
  FileText,
  Loader2,
  Save,
  Wallet,
} from "lucide-react";
import { Stepper, type StepperStep } from "@/components/ui/stepper";

import { TOUR_FORM_COPY } from "../constants/copy";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { buildTourFormSchema, type TourInput, type TourOutput } from "../schemas/tour.schema";
import {
  extractTourId,
  useCreateTour,
  useUpdateTour,
  useUploadTourBrochure,
} from "../hooks/useTours";
import { formatForDateInput, getTodayInMexico } from "@/shared/utils/tour-date.util";
import { useAgency } from "@/features/settings/hooks/useAgency";
import { TourGeneralSection } from "./form-sections/TourGeneralSection";
import { TourBoardingSection } from "./form-sections/TourBoardingSection";
import { TourAssetSection } from "./form-sections/TourAssetSection";
import { TourFinanceSection } from "./form-sections/TourFinanceSection";
import { TourInstructionsField } from "./form-sections/TourInstructionsField";
import { DEFAULT_CURRENCY } from "@/shared/constants/domain.constants";
import { TourSummary } from "./form-sections/TourSummary";
import {
  TOUR_FORM_LAST_STEP,
  TOUR_FORM_STEP_FIELDS,
  TOUR_FORM_STEP_TITLES,
  findFirstStepWithError,
  hasPaymentMethodsIssue,
} from "../utils/tour-form-steps.util";
import { buildApiPublicFileUrl } from "@/shared/utils/share-links.util";

interface TourFormProps {
  tour?: TourOutput;
}

/** Tiempo tras llegar al último paso en el que se ignora un envío (clic doble sobre "Siguiente"). */
const SAVE_ARMING_DELAY_MS = 600;

const STEP_ICONS = [CalendarRange, Bus, Wallet, FileText];
const TOUR_FORM_STEPS: StepperStep[] = TOUR_FORM_STEP_TITLES.map((title, index) => ({
  title,
  icon: STEP_ICONS[index],
}));

export function TourForm({ tour }: TourFormProps) {
  const isEditing = !!tour;
  const router = useRouter();
  // Wizard de 4 pasos sobre UN solo formulario: el paso solo decide qué sección se ve. Al editar
  // todos los pasos están completos (los datos ya existen) y se puede saltar a cualquiera.
  const [currentStep, setCurrentStep] = useState(0);
  // Instante en que "Siguiente" llevó al último paso: un clic rezagado no debe guardar sin verlo.
  const reachedLastStepAtRef = useRef(0);
  const [completedSteps, setCompletedSteps] = useState<ReadonlySet<number>>(
    () => new Set(isEditing ? [0, 1, 2, 3] : []),
  );

  // La API sirve los archivos en `<origen>/public/...`, fuera del prefijo `/api`.
  const initialBrochureUrl = tour?.brochureUrl ? buildApiPublicFileUrl(tour.brochureUrl) : null;
  const [brochureFile, setBrochureFile] = useState<File | null>(null);
  const [existingBrochure, setExistingBrochure] = useState<string | null>(initialBrochureUrl);

  const { mutateAsync: createTour, isPending: isCreating } = useCreateTour();
  const { mutateAsync: updateTour, isPending: isUpdating } = useUpdateTour();
  const { mutateAsync: uploadBrochureTour, isPending: isUploading } = useUploadTourBrochure();
  const agencyQuery = useAgency();
  const agencyData = agencyQuery.data;

  // Incluye la subida del folleto: mientras sube, "Guardar" sigue deshabilitado (evita duplicados).
  const isProcessing = isCreating || isUpdating || isUploading;
  // Decisión del PM: con pagos registrados, la moneda y el precio por pasajero no se editan
  // (protege la contabilidad). La API también lo valida y responde 409.
  const isPricingFrozen = !!tour?.hasPayments;

  // Salida no anterior a hoy; al editar se puede conservar la fecha guardada aunque ya pasó.
  const originalDepartureDate = tour ? formatForDateInput(tour.departureDateTime) : null;
  const today = getTodayInMexico();
  const minDepartureDate =
    originalDepartureDate && originalDepartureDate < today ? originalDepartureDate : today;

  // Regla de transferencia sin CLABE (OBS-038): solo cuando ya se conocen los datos de la agencia.
  const agencyHasClabe = agencyData ? Boolean(agencyData.clabeNumber?.trim()) : undefined;

  const tourFormSchema = buildTourFormSchema(originalDepartureDate, { agencyHasClabe });
  const form = useForm<TourInput>({
    resolver: zodResolver(tourFormSchema),
    mode: "onChange",
    defaultValues: tour
      ? {
          ...tour,
          depositPerPerson: tour.depositPerPerson ?? 0,
          currency: tour.currency ?? DEFAULT_CURRENCY,
        }
      : {
          title: "",
          description: "",
          price: 0,
          currency: "MXN",
          departureDateTime: "",
          maxCapacity: 0,
          staffCapacity: 0,
          acceptsBankTransfer: false,
          acceptsCreditCard: false,
          acceptsCash: false,
          cashInstructions: "",
          boardingPoints: [{ location: "", time: "06:00" }],
          postPaymentInstructions: "",
          depositPerPerson: 0,
          destinationType: "NATIONAL",
        },
  });

  // `useWatch` (no `form.watch`): compatible con el React Compiler. Solo los campos que disparan
  // validaciones cruzadas; la sección de finanzas observa los suyos.
  const [depositValue, price, departureDateTime, returnDate, maxCapacity] = useWatch({
    control: form.control,
    name: ["depositPerPerson", "price", "departureDateTime", "returnDate", "maxCapacity"],
  });
  const depositPerPerson = depositValue || 0;
  const [acceptsBankTransfer] = useWatch({ control: form.control, name: ["acceptsBankTransfer"] });

  // Al cargar la agencia o guardar la CLABE desde el modal, se revalida la regla de transferencia sin
  // CLABE (sin marcar en rojo campos que la persona todavía no ha tocado).
  useEffect(() => {
    if (acceptsBankTransfer) form.trigger("acceptsBankTransfer");
  }, [agencyHasClabe, acceptsBankTransfer, form]);

  // Validación cruzada precio ⇄ anticipo: solo revalida los campos que la persona ya tocó, para no
  // mostrar "El precio debe ser mayor a 0" en un formulario recién abierto.
  useEffect(() => {
    const touchedFields = (["depositPerPerson", "price"] as const).filter((name) => {
      const { isDirty, isTouched } = form.getFieldState(name);
      return isDirty || isTouched;
    });
    if (touchedFields.length > 0) form.trigger(touchedFields);
  }, [price, depositPerPerson, form]);

  useEffect(() => {
    if (form.getFieldState("staffCapacity").isDirty) form.trigger("staffCapacity");
  }, [maxCapacity, form]);

  useEffect(() => {
    if (returnDate && departureDateTime) {
      form.trigger(["returnDate", "departureDateTime"]);
    }
  }, [departureDateTime, returnDate, form]);

  useEffect(() => {
    if (tour) {
      form.reset({
        ...tour,
        currency: tour.currency ?? DEFAULT_CURRENCY,
        departureDateTime: formatForDateInput(tour?.departureDateTime),
        cashInstructions: tour.cashInstructions ?? "",
        description: tour.description ?? "",
        postPaymentInstructions: tour.postPaymentInstructions ?? "",
        destinationType: tour.destinationType ?? "NATIONAL",
      });
      // Valida al cargar: si el tour guardado no cumple una regla (p. ej. una regla que solo valida
      // el front), el operador ve los campos en rojo en lugar de un botón deshabilitado sin motivo.
      form.trigger();
    }
  }, [tour, form]);

  // "Limpiar" también regresa el folleto a su estado inicial (vive fuera del formulario).
  const handleReset = (): void => {
    form.reset();
    setBrochureFile(null);
    setExistingBrochure(initialBrochureUrl);
    if (!isEditing) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
    }
  };

  /**
   * "Siguiente": valida SOLO los campos del paso actual (el error se ve en su campo y no se avanza).
   * La regla de métodos de cobro es un error de raíz del schema: en el paso de finanzas se revisa
   * aparte para mostrarla ahí y no al final.
   */
  const goToNextStep = async (): Promise<void> => {
    let isStepValid = await form.trigger([...TOUR_FORM_STEP_FIELDS[currentStep]]);
    if (currentStep === 2) {
      const paymentIssue = hasPaymentMethodsIssue(tourFormSchema, form.getValues());
      if (paymentIssue) {
        form.setError("root.paymentMethods", { type: "custom", message: paymentIssue });
        isStepValid = false;
      } else {
        form.clearErrors("root.paymentMethods");
      }
    }
    if (!isStepValid) return;
    setCompletedSteps((previous) => new Set(previous).add(currentStep));
    if (currentStep + 1 >= TOUR_FORM_LAST_STEP) reachedLastStepAtRef.current = Date.now();
    setCurrentStep((step) => Math.min(step + 1, TOUR_FORM_LAST_STEP));
  };

  const goToPreviousStep = (): void => setCurrentStep((step) => Math.max(step - 1, 0));

  // Desde la barra: pasos ya completados (o, al editar, cualquiera) para corregir datos.
  const isStepClickable = (index: number): boolean =>
    isEditing || completedSteps.has(index) || index < currentStep;

  /** Al guardar con errores (p. ej. se corrigió un paso anterior), lleva al primer paso afectado. */
  const onInvalid = (errors: FieldErrors<TourInput>) => {
    const step = findFirstStepWithError(errors);
    if (step !== null) setCurrentStep(step);
    toast.error("Revisa los datos del tour", {
      description: "Hay campos por completar o corregir en el paso marcado.",
    });
  };

  /**
   * Sube el folleto después de guardar el tour. Si falla, el tour YA está guardado: se avisa y,
   * al crear, se lleva al operador a la edición del tour nuevo para reintentar ahí. Así un segundo
   * clic en "Guardar Tour" nunca crea un tour duplicado. El hook ya muestra el error de la API.
   */
  const uploadBrochureAfterSave = async (tourId: string): Promise<boolean> => {
    if (!brochureFile) return true;
    try {
      await uploadBrochureTour({ tourId, file: brochureFile });
      return true;
    } catch {
      toast.warning("El tour se guardó, pero el folleto no se subió", {
        description: "Vuelve a adjuntar el PDF desde la edición del tour.",
      });
      if (!isEditing) router.push(`/tours/${tourId}/edit`);
      return false;
    }
  };

  const onSubmit = async (formData: TourInput): Promise<void> => {
    try {
      let currentTourId = tour?.id || "";

      // 1. Sanitización de capa de red: Convertir cadenas vacías ("") a explícito null
      const basePayload = {
        ...formData,
        cashInstructions: formData.cashInstructions?.trim() || null,
        postPaymentInstructions: formData.postPaymentInstructions?.trim() || null,
        returnDate: formData.returnDate?.trim() || null,
      };

      if (isEditing && tour.id) {
        // 2. Flujo de Edición: el folleto se quita solo si el operador lo eliminó y no adjuntó otro.
        const removeBrochure =
          Boolean(tour.brochureUrl) && existingBrochure === null && brochureFile === null;
        const updatePayload = { ...basePayload, removeBrochure };
        await updateTour({ tourId: tour.id, tourData: updatePayload });
      } else {
        // 3. Flujo de Creación: Enviamos el payload limpio (sin removeBrochure)
        const response = await createTour(basePayload);
        currentTourId = extractTourId(response) ?? "";
      }

      // Folleto post-persistencia (endpoint aparte). Si falla, el tour ya quedó guardado.
      if (currentTourId && !(await uploadBrochureAfterSave(currentTourId))) return;

      form.reset();
      setBrochureFile(null);
      router.push("/tours");
    } catch {
      // Crear o actualizar falló: el hook ya mostró el error de la API y no se guardó nada.
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 pb-5">
        <CardTitle className="text-2xl font-semibold text-slate-800">
          {isEditing ? "Modificar Configuración del Tour" : TOUR_FORM_COPY.title}
        </CardTitle>
        <CardDescription className="text-base">
          {isEditing
            ? "Actualiza las fechas, logística de abordaje, cupos y condiciones de pago de esta excursión."
            : TOUR_FORM_COPY.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-6 pt-6 sm:px-8">
        <Stepper
          steps={TOUR_FORM_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          isStepClickable={isStepClickable}
          onStepClick={setCurrentStep}
        />

        <FormProvider {...form}>
          <form
            id="tour-form"
            // Enter en un campo de un paso intermedio avanza (valida el paso), nunca guarda.
            onSubmit={(event) => {
              if (currentStep < TOUR_FORM_LAST_STEP) {
                event.preventDefault();
                void goToNextStep();
                return;
              }
              // Un segundo clic rápido sobre "Siguiente" cae sobre "Guardar": no se envía.
              if (Date.now() - reachedLastStepAtRef.current < SAVE_ARMING_DELAY_MS) {
                event.preventDefault();
                return;
              }
              // react-hook-form descarta los errores de raíz al enviar: la regla de métodos de
              // cobro se revisa aquí para no guardar un tour sin forma de pago.
              const paymentIssue = hasPaymentMethodsIssue(tourFormSchema, form.getValues());
              if (paymentIssue) {
                event.preventDefault();
                form.setError("root.paymentMethods", { type: "custom", message: paymentIssue });
                setCurrentStep(2);
                toast.error("Revisa los métodos de cobro", { description: paymentIssue });
                return;
              }
              void form.handleSubmit(onSubmit, onInvalid)(event);
            }}
            className="space-y-8"
          >
            {currentStep === 0 && <TourGeneralSection minDepartureDate={minDepartureDate} />}
            {currentStep === 1 && <TourBoardingSection />}
            {currentStep === 2 && (
              <TourFinanceSection
                isPricingFrozen={isPricingFrozen}
                agency={agencyData}
                agencyLoadFailed={agencyQuery.isError && !agencyData}
                onRetryAgency={() => void agencyQuery.refetch()}
                isRetryingAgency={agencyQuery.isFetching}
              />
            )}
            {currentStep === 3 && (
              <>
                <TourInstructionsField />
                <TourAssetSection
                  brochureFile={brochureFile}
                  setBrochureFile={setBrochureFile}
                  existingBrochure={existingBrochure}
                  setExistingBrochure={setExistingBrochure}
                  isProcessing={isProcessing}
                />
                <TourSummary />
              </>
            )}
          </form>
        </FormProvider>
      </CardContent>

      <CardFooter className="flex flex-col-reverse justify-end gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50/80 px-6 pt-5 pb-6 sm:flex-row sm:items-center sm:px-8">
        {/* En el último paso explica por qué "Guardar" está deshabilitado. */}
        {currentStep === TOUR_FORM_LAST_STEP &&
          !form.formState.isValid &&
          (isEditing || form.formState.isDirty) && (
            <p
              role="status"
              className="flex items-center gap-1.5 text-xs font-medium text-amber-700 sm:mr-auto"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              Completa o corrige los campos marcados para poder guardar.
            </p>
          )}
        {currentStep > 0 && (
          <Button
            type="button"
            variant="ghost"
            onClick={goToPreviousStep}
            disabled={isProcessing}
            className="sm:mr-auto"
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Anterior
          </Button>
        )}
        <Button type="button" variant="outline" onClick={handleReset} disabled={isProcessing}>
          {TOUR_FORM_COPY.actions.reset}
        </Button>
        {currentStep < TOUR_FORM_LAST_STEP ? (
          <Button
            // `key` distinto del de "Guardar": React no reutiliza el mismo <button> cambiándole
            // el `type`, así el clic que avanza nunca activa el envío nativo del formulario.
            key="next-step"
            type="button"
            onClick={() => void goToNextStep()}
            className="flex h-11 min-w-[140px] items-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            Siguiente <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            key="save-tour"
            type="submit"
            form="tour-form"
            // Solo mientras guarda: con un error en otro paso, el clic lleva a ese paso (onInvalid).
            disabled={isProcessing}
            className="flex h-11 min-w-[140px] items-center gap-2 rounded-xl bg-indigo-600 px-6 font-semibold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.99] disabled:bg-slate-300 disabled:text-slate-500"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />{" "}
                {isEditing ? "Guardar Cambios" : TOUR_FORM_COPY.actions.submit}
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
