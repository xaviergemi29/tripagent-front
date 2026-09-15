"use client"

import { useFormContext, useFieldArray, useWatch } from "react-hook-form"
import { Users, User, Link as LinkIcon, Copy, Plus, Trash2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { BookingFormValues } from "../schemas/bookingSchema"
import { useTravelerLookup } from "@/features/travelers/hooks/useTravelers"
import { useState } from "react"

interface CompanionsManagerProps {
    token: string
    groupId: string
    boardingPoints: { id: string; location: string; time: string }[]
}

export function CompanionsManager({ token, groupId, boardingPoints }: CompanionsManagerProps) {
    const { control, register, setValue, formState: { errors } } = useFormContext<BookingFormValues>()
    const { lookupTraveler } = useTravelerLookup()

    // Estado local para rastrear cuáles acompañantes por índice están bloqueados por match en BD
    const [lockedCompanions, setLockedCompanions] = useState<Record<number, boolean>>({})

    const hasCompanions = useWatch({ control, name: "hasCompanions", defaultValue: false })
    const companionMethod = useWatch({ control, name: "companionMethod", defaultValue: "MANUAL" })

    const { fields, append, remove } = useFieldArray({
        control,
        name: "companions",
    })

    // ✅ 1. Extraemos TODO el array de companions usando useWatch para mantener la reactividad total
    // TypeScript inferirá perfectamente que companions es de tipo Companion[]
    const watchedCompanions = useWatch({ control, name: "companions" }) || [];

    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?token=${token}&group_id=${groupId}`

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink)
            toast.success("Enlace copiado al portapapeles")
        } catch (err) {
            toast.error("Error al copiar enlace")
        }
    }

    const handleCompanionBlur = async (index: number, value: string) => {
        if (!value || value.trim().length < 3 || lockedCompanions[index]) return;

        const traveler = await lookupTraveler(value);

        if (traveler) {
            setValue(`companions.${index}.fullName`, traveler.fullName, { shouldValidate: true });
            setValue(`companions.${index}.whatsappPhone`, traveler.whatsappPhone, { shouldValidate: true });
            setValue(`companions.${index}.email`, traveler.email, { shouldValidate: true });
            setValue(`companions.${index}.emergencyContactName`, traveler.emergencyContactName, { shouldValidate: true });
            setValue(`companions.${index}.emergencyContactPhone`, traveler.emergencyContactPhone, { shouldValidate: true });
            setValue(`companions.${index}.medicalNotes`, traveler.medicalNotes || "", { shouldValidate: true });

            setLockedCompanions(prev => ({ ...prev, [index]: true }));

            toast.success(`Acompañante ${index + 1} encontrado`, {
                description: "Se autocompletaron sus datos históricos."
            });
        }
    }

    const handleRemoveCompanion = (index: number) => {
        remove(index);
        // Limpiamos la bandera de bloqueo y reordenamos el diccionario de estados
        setLockedCompanions(prev => {
            const next = { ...prev };
            delete next[index];
            return next;
        });
    }

    return (
        <div className="space-y-6 p-6 bg-white border rounded-xl shadow-sm">
            <div className="space-y-4">
                <div className="space-y-1">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        ¿Cómo viajas esta vez?
                    </Label>
                    <p className="text-sm text-slate-500">
                        Selecciona si viajas solo o necesitas registrar acompañantes en tu grupo.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setValue("hasCompanions", false, { shouldValidate: true, shouldDirty: true })}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 ${!hasCompanions
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <User className={`w-6 h-6 mb-2 ${!hasCompanions ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="font-semibold">Viajo solo</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setValue("hasCompanions", true, { shouldValidate: true, shouldDirty: true })}
                        className={`flex flex-col items-center justify-center p-4 border-2 rounded-xl transition-all duration-200 ${hasCompanions
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                            : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                            }`}
                    >
                        <Users className={`w-6 h-6 mb-2 ${hasCompanions ? 'text-indigo-600' : 'text-slate-400'}`} />
                        <span className="font-semibold">Viajo acompañado</span>
                    </button>
                </div>
            </div>

            {hasCompanions && (
                <div className="space-y-6 pt-6 border-t animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold">Método de registro para tus acompañantes</Label>
                        <RadioGroup
                            value={companionMethod}
                            onValueChange={(val: "MANUAL" | "SHARE_LINK") =>
                                setValue("companionMethod", val, { shouldValidate: true })
                            }
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <div
                                className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer flex-1 transition-colors ${companionMethod === 'MANUAL' ? 'border-indigo-600 bg-indigo-50/50' : 'hover:bg-slate-50'
                                    }`}
                                onClick={() => setValue("companionMethod", "MANUAL")}
                            >
                                <RadioGroupItem value="MANUAL" id="r-manual" />
                                <Label htmlFor="r-manual" className="cursor-pointer font-medium">Llenar sus datos yo mismo</Label>
                            </div>

                            <div
                                className={`flex items-center space-x-3 border p-4 rounded-xl cursor-pointer flex-1 transition-colors ${companionMethod === 'SHARE_LINK' ? 'border-indigo-600 bg-indigo-50/50' : 'hover:bg-slate-50'
                                    }`}
                                onClick={() => setValue("companionMethod", "SHARE_LINK")}
                            >
                                <RadioGroupItem value="SHARE_LINK" id="r-link" />
                                <Label htmlFor="r-link" className="cursor-pointer font-medium">Delegar con enlace mágico</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {companionMethod === "MANUAL" && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            {fields.map((field, index) => {
                                const isLocked = !!lockedCompanions[index];
                                const { onBlur: phoneOnBlur, ...phoneRest } = register(`companions.${index}.whatsappPhone`);
                                const { onBlur: emailOnBlur, ...emailRest } = register(`companions.${index}.email`);
                                // ✅ 2. Leemos la propiedad de manera segura y tipada desde el array observado
                                // Si por latencia inicial no existe en el array observado, hacemos un fallback seguro.
                                const currentCompanion = watchedCompanions[index] || field;
                                const passengerType = currentCompanion.passengerType || "ADULT";
                                return (
                                    <div key={field.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200 shadow-sm relative space-y-4">
                                        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-sm font-bold uppercase tracking-wider text-slate-700">
                                                    Acompañante {index + 1}
                                                </Label>
                                                {isLocked && (
                                                    <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium">
                                                        <Lock className="w-3 h-3 text-amber-600" /> Verificado
                                                    </span>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-red-50"
                                                onClick={() => handleRemoveCompanion(index)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border">
                                            <Label className="text-sm font-semibold text-slate-600">Este pasajero es:</Label>
                                            <RadioGroup
                                                value={passengerType}
                                                onValueChange={(val: "ADULT" | "CHILD") => {
                                                    setValue(`companions.${index}.passengerType`, val, { shouldValidate: true });
                                                    if (val === "CHILD") {
                                                        setValue(`companions.${index}.whatsappPhone`, "");
                                                        setValue(`companions.${index}.email`, "");
                                                    }
                                                }}
                                                disabled={isLocked}
                                                className="flex gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="ADULT" id={`adult-${index}`} />
                                                    {/* Ajuste de copy para mayoría de edad */}
                                                    <Label htmlFor={`adult-${index}`} className="cursor-pointer">Mayor de edad (18 o más)</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="CHILD" id={`child-${index}`} />
                                                    {/* Ajuste de copy para menores */}
                                                    <Label htmlFor={`child-${index}`} className="cursor-pointer">Menor de edad (Menor de 18)</Label>
                                                </div>
                                            </RadioGroup>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-xs font-semibold text-slate-600">Nombre Completo *</Label>
                                                <Input
                                                    {...register(`companions.${index}.fullName`)}
                                                    disabled={isLocked}
                                                    placeholder="Ej. Juan Pérez"
                                                    className={isLocked ? "bg-slate-200/60 cursor-not-allowed" : "bg-white"}
                                                />
                                                {errors.companions?.[index]?.fullName && (
                                                    <p className="text-xs text-destructive">{errors.companions[index]?.fullName?.message}</p>
                                                )}
                                            </div>

                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-xs font-semibold text-slate-600">¿En qué punto subirás al autobús? *</Label>
                                                <select
                                                    {...register(`companions.${index}.boardingPoint`)}
                                                    className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Selecciona una opción...</option>
                                                    {boardingPoints.map((point) => (
                                                        <option key={point.id} value={`${point.location} (${point.time})`}>
                                                            {point.location} - {point.time}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.companions?.[index]?.boardingPoint && (
                                                    <p className="text-xs text-red-500 mt-1">{errors.companions?.[index]?.boardingPoint.message}</p>
                                                )}
                                            </div>

                                            {/* ✅ Renderizado condicional: Solo mostramos contacto si es adulto */}
                                            {passengerType === "ADULT" && (
                                                <>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-slate-600">WhatsApp (Opcional)</Label>
                                                        <Input
                                                            {...phoneRest}
                                                            disabled={isLocked}
                                                            onBlur={async (e) => {
                                                                phoneOnBlur(e);
                                                                await handleCompanionBlur(index, e.target.value);
                                                            }}
                                                            placeholder=""
                                                            className={isLocked ? "bg-slate-200/60 cursor-not-allowed" : "bg-white"}
                                                        />
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label className="text-xs font-semibold text-slate-600">Correo Electrónico (Opcional)</Label>
                                                        <Input
                                                            {...emailRest}
                                                            type="email"
                                                            disabled={isLocked}
                                                            onBlur={async (e) => {
                                                                emailOnBlur(e);
                                                                await handleCompanionBlur(index, e.target.value);
                                                            }}
                                                            placeholder="correo@ejemplo.com"
                                                            className={isLocked ? "bg-slate-200/60 cursor-not-allowed" : "bg-white"}
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            {/* Los inputs de Contacto de Emergencia van fuera, siempre visibles */}
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-600">Contacto de Emergencia *</Label>
                                                <Input {...register(`companions.${index}.emergencyContactName`)} placeholder="Nombre del familiar" className="bg-white" />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-semibold text-slate-600">Teléfono de Emergencia *</Label>
                                                <Input {...register(`companions.${index}.emergencyContactPhone`)} placeholder="228 999 ..." className="bg-white" />
                                            </div>

                                            <div className="space-y-1.5 md:col-span-2">
                                                <Label className="text-xs font-semibold text-slate-600">Notas Médicas / Alergias (Opcional)</Label>
                                                <Input {...register(`companions.${index}.medicalNotes`)} placeholder="Ej. Asma, alergia a picaduras..." className="bg-white" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => append({
                                    fullName: "",
                                    whatsappPhone: "",
                                    email: "",
                                    emergencyContactName: "",
                                    emergencyContactPhone: "",
                                    medicalNotes: "",
                                    passengerType: "ADULT",
                                    boardingPoint: ""
                                })}
                                className="w-full border-dashed border-2 py-6 text-slate-600 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Añadir Persona
                            </Button>
                        </div>
                    )}

                    {companionMethod === "SHARE_LINK" && (
                        <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 p-6 rounded-xl border border-indigo-100 space-y-4 animate-in fade-in duration-300 shadow-sm">
                            <div>
                                <Label className="text-indigo-950 font-semibold flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4 text-indigo-600" />
                                    Enlace de Invitación de Grupo
                                </Label>
                                <p className="text-sm text-slate-600 mt-1">
                                    Copia este enlace y compártelo por WhatsApp. Al registrarse, tus amigos quedarán automáticamente vinculados a tu reserva ({groupId.split('-')[0]}).
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <Input readOnly value={inviteLink} className="bg-white text-slate-600 font-mono text-sm border-indigo-200 focus-visible:ring-indigo-500" />
                                <Button type="button" className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0" onClick={handleCopyLink}>
                                    <Copy className="w-4 h-4 mr-2" /> Copiar
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}