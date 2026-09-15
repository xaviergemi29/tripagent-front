"use client"

import { useForm, FormProvider } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckCircle2, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { bookingFormSchema, BookingOutput, type BookingFormValues } from "../schemas/bookingSchema"
import { CompanionsManager } from "./CompanionsManager"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useTravelerLookup } from "@/features/travelers/hooks/useTravelers"
import { useCreateBooking } from "../hooks/useBookings"
import { useState } from "react"

export function TourRegistrationView({
    token,
    initialGroupId,
    boardingPoints
}: {
    token: string;
    initialGroupId?: string;
    boardingPoints: { id: string; location: string; time: string }[];
}) {
    const [groupId] = useState(() => initialGroupId || crypto.randomUUID())
    const [isLookingUp, setIsLookingUp] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false);
    const { mutateAsync: createBooking, isPending } = useCreateBooking();
    const [isMainClientFound, setIsMainClientFound] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<BookingOutput>();

    const { lookupTraveler } = useTravelerLookup()

    const methods = useForm<BookingFormValues>({
        resolver: zodResolver(bookingFormSchema),
        mode: "onTouched",
        defaultValues: {
            token,
            mainClient: {
                fullName: "",
                whatsappPhone: "",
                email: "",
                emergencyContactName: "",
                emergencyContactPhone: "",
                medicalNotes: "",
                birthDate: "",
            },
            hasCompanions: false,
            companionMethod: "MANUAL",
            groupId,
            companions: []
        }
    })

    const handleFieldBlur = async (value: string) => {
        if (!value || value.trim().length < 3 || isMainClientFound) return;

        setIsLookingUp(true)
        const traveler = await lookupTraveler(value)
        setIsLookingUp(false)

        if (traveler) {
            methods.setValue("mainClient.fullName", traveler.fullName, { shouldValidate: true })
            methods.setValue("mainClient.whatsappPhone", traveler.whatsappPhone, { shouldValidate: true })
            methods.setValue("mainClient.email", traveler.email, { shouldValidate: true })
            methods.setValue("mainClient.emergencyContactName", traveler.emergencyContactName, { shouldValidate: true })
            methods.setValue("mainClient.emergencyContactPhone", traveler.emergencyContactPhone, { shouldValidate: true })
            methods.setValue("mainClient.medicalNotes", traveler.medicalNotes || "", { shouldValidate: true })

            setIsMainClientFound(true)

            toast.success("¡Cliente registrado encontrado!", {
                description: "Tus datos personales se han cargado y bloqueado por seguridad."
            })
        }
    }

    const onSubmit = async (data: BookingFormValues) => {
        const payload = {
            ...data,
            companions: data.companionMethod === "SHARE_LINK" ? [] : data.companions
        }

        try {
            const data = await createBooking(payload);
            console.log("data",data)
            setPaymentDetails(data);
            setIsSuccess(true);
        } catch (error) {
            // El hook ya dispara un toast de error, pero el catch es necesario
            // si la promesa explota, para evitar que la app se rompa silenciosamente.
            console.error("Fallo en la mutación:", error);
        }

        console.log("Enviando a Node.js:", payload)
    }

    const { onBlur: rhfPhoneOnBlur, ...rhfPhoneRest } = methods.register("mainClient.whatsappPhone");
    const { onBlur: rhfEmailOnBlur, ...rhfEmailRest } = methods.register("mainClient.email");
    console.log("!methods.formState.isValid", methods.formState.isValid);
    const { errors } = methods.formState;
    console.log(methods.formState.errors)

    if (isSuccess && paymentDetails) {
        console.log("paymentDetails", paymentDetails)
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in zoom-in-95 duration-300">
                {/* Cabecera de Éxito */}
                <div className="text-center space-y-4 py-8 bg-white rounded-2xl shadow-sm border px-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-slate-900">¡Tus lugares están reservados!</h2>
                        <p className="text-slate-500">Hemos asegurado el cupo para ti y tu grupo.</p>
                    </div>
                </div>

                {/* Módulo de Pagos */}
                <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                    <div className="bg-slate-50 p-6 border-b">
                        <h3 className="text-lg font-bold text-slate-900">Completa tu pago</h3>
                        <p className="text-sm text-slate-500 mt-1">Elige el método de pago que prefieras para confirmar definitivamente tu viaje.</p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Opción 1: Link de Pago (La más fácil para el usuario) */}
                        {paymentDetails?.acceptsCreditCard && (
                            <div className="p-5 border border-indigo-100 bg-indigo-50/50 rounded-xl space-y-3">
                                <h4 className="font-semibold text-indigo-900 flex items-center gap-2">
                                    Pago con Tarjeta
                                </h4>
                                <p className="text-sm text-indigo-700/80">Paga de forma segura a través de nuestra pasarela.</p>
                                <Button
                                    className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={() => window.open(paymentDetails?.paymentLink || "", "_blank")}
                                >
                                    Pagar en Línea Ahora
                                </Button>
                            </div>
                        )}

                        {/* Opción 2: Transferencia (Requiere acción manual del usuario) */}
                        {paymentDetails?.acceptsBankTransfer && (
                            <div className="p-5 border rounded-xl space-y-3">
                                <h4 className="font-semibold text-slate-900">Transferencia Bancaria (SPEI)</h4>
                                <div className="bg-slate-50 p-4 rounded-lg text-sm font-mono text-slate-700 whitespace-pre-wrap border">
                                    {paymentDetails.bankDetails}
                                </div>
                                <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                    <strong>Importante:</strong> Tras realizar tu transferencia, por favor envía la captura del comprobante por WhatsApp a tu agente.
                                </div>
                            </div>
                        )}

                        {/* Opción 3: Efectivo */}
                        {paymentDetails?.acceptsCash && (
                            <div className="p-5 border rounded-xl space-y-2">
                                <h4 className="font-semibold text-slate-900">Pago en Efectivo</h4>
                                <p className="text-sm text-slate-600">{paymentDetails?.cashInstructions}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">

                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 relative">
                    {isLookingUp && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                        </div>
                    )}

                    <div className="flex justify-between items-center border-b pb-2">
                        <h2 className="text-xl font-bold text-slate-900">Tus Datos</h2>
                        {isMainClientFound && (
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border px-2.5 py-1 rounded-md">
                                    <Lock className="w-3.5 h-3.5 text-amber-600" /> Verificado
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsMainClientFound(false);
                                        methods.resetField("mainClient.whatsappPhone");
                                        // ... resetear otros campos
                                    }}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Cambiar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Teléfono de WhatsApp *</Label>
                        <Input
                            {...rhfPhoneRest}
                            disabled={isMainClientFound}
                            onBlur={async (e) => {
                                rhfPhoneOnBlur(e);
                                await handleFieldBlur(e.target.value);
                            }}
                            placeholder="Ej. 228 123 4567"
                            className={isMainClientFound ? "bg-slate-100 cursor-not-allowed" : ""}
                        />
                        {errors.mainClient?.whatsappPhone && (
                            <p className="text-xs text-red-500 mt-1">{errors.mainClient.whatsappPhone.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label>Nombre Completo *</Label>
                            <Input
                                {...methods.register("mainClient.fullName")}
                                disabled={isMainClientFound}
                                className={isMainClientFound ? "bg-slate-100 cursor-not-allowed" : ""}
                            />
                            {errors.mainClient?.fullName && (
                                <p className="text-xs text-red-500 mt-1">{errors.mainClient.fullName.message}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Correo Electrónico *</Label>
                            <Input
                                {...rhfEmailRest}
                                type="email"
                                disabled={isMainClientFound}
                                onBlur={async (e) => {
                                    rhfEmailOnBlur(e);
                                    await handleFieldBlur(e.target.value);
                                }}
                                className={isMainClientFound ? "bg-slate-100 cursor-not-allowed" : ""}
                            />
                            {
                                errors.mainClient?.email && (
                                    <p className="text-xs text-red-500 mt-1">{errors.mainClient.email.message}</p>
                                )
                            }
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                        <div className="space-y-1">
                            <Label>Contacto de Emergencia (Nombre) *</Label>
                            <Input {...methods.register("mainClient.emergencyContactName")} placeholder="Familiar o tutor" />
                            {errors.mainClient?.emergencyContactName && (
                                <p className="text-xs text-red-500 mt-1">{errors.mainClient.emergencyContactName.message}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <Label>Teléfono de Emergencia *</Label>
                            <Input {...methods.register("mainClient.emergencyContactPhone")} placeholder="228 999 ..." />
                            {errors.mainClient?.emergencyContactPhone && (
                                <p className="text-xs text-red-500 mt-1">{errors.mainClient.emergencyContactPhone.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1 pt-2">
                        <Label>Notas Médicas / Alergias (Opcional)</Label>
                        <Input {...methods.register("mainClient.medicalNotes")} placeholder="Ej. Asma, lesión en rodilla..." />
                    </div>


                    {/* 1. UI para el Cumpleaños */}
                    <div className="space-y-1.5 md:col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                        <Label className="text-xs font-semibold text-indigo-900">
                            Fecha de nacimiento (Opcional - ¡Tenemos sorpresas! 🎂)
                        </Label>
                        <Input
                            type="date"
                            {...methods.register("mainClient.birthDate")}
                            className="bg-white"
                        />
                    </div>

                    {/* 2. UI para el Punto de Abordaje */}
                    {/* NOTA: boardingPointsOptions vendría de la configuración del Tour (Data Fetching previo) */}
                    <div className="space-y-1.5 md:col-span-2">
                        <Label className="text-xs font-semibold text-slate-600">¿En qué punto subirás al autobús? *</Label>
                        <select
                            {...methods.register("mainClient.boardingPoint")}
                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Selecciona una opción...</option>
                            {boardingPoints.map((point) => (
                                <option key={point.id} value={`${point.location} (${point.time})`}>
                                    {point.location} - {point.time}
                                </option>
                            ))}
                        </select>
                        {errors.mainClient?.boardingPoint && (
                            <p className="text-xs text-red-500 mt-1">{errors.mainClient.boardingPoint.message}</p>
                        )}
                    </div>
                </div>

                <CompanionsManager token={token} groupId={groupId} boardingPoints={boardingPoints}/>

                <Button disabled={!methods.formState.isValid || isPending} type="submit" className="w-full" size="lg">
                    {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    Confirmar Registro
                </Button>
            </form>
        </FormProvider>
    )
}