import { NextResponse } from "next/server";
import { tourSchema } from "@/features/tours/schemas/tourSchema";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validamos estrictamente en el servidor usando el MISMO esquema de Zod.
    // Esto previene que payloads maliciosos o corruptos pasen a la base de datos.
    const result = tourSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Datos inválidos", errors: result.error.format() },
        { status: 400 }
      );
    }

    // Simulamos persistencia (aquí en el futuro insertarás en tu DB vía Drizzle ORM)
    const newTour = {
      id: crypto.randomUUID(),
      ...result.data,
    };

    // Retornamos el recurso creado con éxito
    return NextResponse.json(newTour, { status: 201 });
  } catch (error) {
    console.error("Error en POST /api/tours:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 }
    );
  }
}