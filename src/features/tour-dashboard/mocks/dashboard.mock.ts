import { TourDashboardOutput } from "../schemas/tourDashboardSchema";

export const MOCK_DASHBOARD_DATA: TourDashboardOutput[] = [{
    tourId: "065060b9-1eda-4b09-a699-f66b24a573c0", 
    tourName: "Hiking Cofre de Perote (Mock)",
    departureDate: "2026-11-15T08:00:00Z",
    metrics: {
        occupancy: { current: 28, max: 40 },
        revenue: { projected: 20000, collected: 14000 },
        pendingValidations: 3,
        pendingForms: 5,
    },
    travelers: [
        {
            // UUID real
            id: "550e8400-e29b-41d4-a716-446655440000", 
            fullName: "Juan Pérez",
            role: "TITULAR",
            groupSize: 3,
            whatsapp: "+522281234567",
            formStatus: "COMPLETED",
            paymentStatus: "PAID",
            totalCost: 1500,
            paidAmount: 1500,
            balance: 0,
        },
        {
            // UUID real
            id: "a38c23c7-1234-4567-b890-123456789abc", 
            fullName: "María López",
            role: "COMPANION",
            titularName: "Juan Pérez",
            whatsapp: "+522287654321",
            formStatus: "PENDING",
            paymentStatus: "PAID",
            totalCost: 1500,
            paidAmount: 1500,
            balance: 0,
        },
        {
            // UUID real
            id: "c49d34d8-2345-4678-b901-234567890bcd", 
            fullName: "Carlos Slim",
            role: "TITULAR",
            groupSize: 1,
            whatsapp: "+525551234567",
            formStatus: "COMPLETED",
            paymentStatus: "PENDING_VALIDATION",
            totalCost: 500,
            paidAmount: 0,
            balance: 500,
        }
    ]
}];