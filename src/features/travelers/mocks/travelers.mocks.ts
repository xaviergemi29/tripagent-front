import type { TravelerOutput } from "../schemas/travelerSchema"

export const MOCK_TRAVELERS: TravelerOutput[] = [
  {
    id: "trav-uuid-01",
    whatsappPhone: "+525512345678",
    email: "carlos.slim@example.com",
    fullName: "Carlos Slim",
    emergencyContactName: "Oficina Slim",
    emergencyContactPhone: "+525555555555",
    medicalNotes: "Ninguna",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trav-uuid-02",
    whatsappPhone: "+523398765432",
    email: "guillermo.toro@example.com",
    fullName: "Guillermo del Toro",
    emergencyContactName: "Alejandro G. Iñárritu",
    emergencyContactPhone: "+523311112222",
    medicalNotes: "Asma leve (llevar inhalador de repuesto)",
    createdAt: new Date().toISOString(),
  },
  {
    id: "trav-uuid-03",
    whatsappPhone: "+522245678901",
    email: "salma.hayek@example.com",
    fullName: "Salma Hayek",
    emergencyContactName: "François-Henri Pinault",
    emergencyContactPhone: "+33140000000",
    medicalNotes: "Alergica a la penicilina",
    createdAt: new Date().toISOString(),
  }
]