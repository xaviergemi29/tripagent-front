"use client"

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useReservationsByTour } from "../hooks/useReservations";

interface TourReservationsTableProps {
    tourId: string;
}

export function TourReservationsTable({ tourId }: TourReservationsTableProps) {
    // Hook de TanStack Query para traer a los pasajeros
    const { data: reservations = [], isLoading } = useReservationsByTour(tourId);

    if (isLoading) return <div>Cargando pasajeros...</div>;

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre del Pasajero</TableHead>
                        <TableHead>WhatsApp (Lead)</TableHead>
                        <TableHead>Estado de Pago</TableHead>
                        <TableHead>Asientos</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reservations.map((res) => (
                        <TableRow key={res.id}>
                            <TableCell className="font-medium">{res.customerName}</TableCell>
                            <TableCell className="text-slate-500">{res.phoneNumber}</TableCell>
                            <TableCell>
                                {/* Gestión visual de estados */}
                                {res.paymentStatus === 'PAID' && <Badge className="bg-emerald-500">Pagado</Badge>}
                                {res.paymentStatus === 'PENDING' && <Badge variant="outline" className="text-amber-600 border-amber-600">Pendiente</Badge>}
                                {res.paymentStatus === 'CASH_ON_ARRIVAL' && <Badge variant="secondary">Pago en Van</Badge>}
                            </TableCell>
                            <TableCell>{res.seatsReserved}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" className="text-destructive">
                                    Cancelar Lugar
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}