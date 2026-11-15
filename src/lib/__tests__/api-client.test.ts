// @vitest-environment node
// En jsdom `window.location` no se puede reemplazar; en node se simula `window` completo.
import { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient, type ApiError } from "../api-client";

// El interceptor es el contrato de transporte con la API (sección C de ../CLAUDE.md): desenvuelve
// `{ data }`, normaliza los errores a `ApiError` y saca al usuario con un 401.

const replace = vi.fn();

beforeEach(() => {
  replace.mockReset();
  vi.stubGlobal("window", { location: { replace } });
});
afterEach(() => vi.unstubAllGlobals());

/** Adapter de axios que responde sin red. */
const respondWith =
  (status: number, data: unknown): AxiosAdapter =>
  async (config: InternalAxiosRequestConfig) => {
    const response = { data, status, statusText: "", headers: {}, config };
    if (status >= 400) {
      throw new AxiosError(
        `Request failed with status code ${status}`,
        "ERR_BAD_REQUEST",
        config,
        null,
        response,
      );
    }
    return response;
  };

const failWith = async (url: string, status: number, data: unknown): Promise<ApiError> => {
  try {
    await apiClient.get(url, { adapter: respondWith(status, data) });
  } catch (error) {
    return error as ApiError;
  }
  throw new Error("La petición debía fallar");
};

describe("apiClient: respuestas", () => {
  it("desenvuelve { data } y { success, data }", async () => {
    await expect(
      apiClient.get("/tours", { adapter: respondWith(200, { data: [{ id: "t1" }] }) }),
    ).resolves.toEqual([{ id: "t1" }]);
    await expect(
      apiClient.get("/x", { adapter: respondWith(200, { success: true, data: { id: "b1" } }) }),
    ).resolves.toEqual({ id: "b1" });
  });

  it("`data` con 0, false o cadena vacía es un valor legítimo (no devuelve el sobre)", async () => {
    for (const value of [0, false, ""]) {
      await expect(
        apiClient.get("/x", { adapter: respondWith(200, { data: value }) }),
      ).resolves.toBe(value);
    }
  });

  it("`data: null` sigue devolviendo el sobre (`??` trata null como ausente)", async () => {
    await expect(
      apiClient.get("/x", { adapter: respondWith(200, { data: null }) }),
    ).resolves.toEqual({ data: null });
  });

  it("devuelve el objeto directo cuando no trae `data` (p. ej. el dashboard)", async () => {
    await expect(
      apiClient.get("/dashboards/t1", { adapter: respondWith(200, { tour: { id: "t1" } }) }),
    ).resolves.toEqual({ tour: { id: "t1" } });
  });

  it("en listas paginadas se pierde `pagination` y llega solo el arreglo", async () => {
    await expect(
      apiClient.get("/travelers", {
        adapter: respondWith(200, { data: [{ id: "v1" }], pagination: { total: 1 } }),
      }),
    ).resolves.toEqual([{ id: "v1" }]);
  });
});

describe("apiClient: errores", () => {
  it("normaliza { error } a ApiError con el código de estado", async () => {
    const error = await failWith("/bookings/b1/transfer", 409, { error: "Reserva cancelada" });
    expect(error).toEqual({
      status: 409,
      message: "Reserva cancelada",
      code: undefined,
      issues: [],
    });
  });

  it("prioriza `message` y conserva `code` e `issues` de las validaciones de Zod", async () => {
    const issues = [{ path: ["email"], message: "Correo inválido" }];
    const error = await failWith("/tours", 400, {
      message: "Correo inválido",
      error: "Bad Request",
      code: "FST_ERR_VALIDATION",
      issues,
    });
    expect(error).toMatchObject({
      status: 400,
      message: "Correo inválido",
      code: "FST_ERR_VALIDATION",
      issues,
    });
  });

  it("recorta el prefijo de Fastify ('body/email …')", async () => {
    const error = await failWith("/tours", 400, {
      message: "body/email Correo electrónico inválido",
    });
    expect(error.message).toBe("Correo electrónico inválido");
  });

  it("muestra el texto del límite de intentos (429) tal cual", async () => {
    const error = await failWith("/public/pre-booking", 429, {
      error: "Demasiados intentos. Vuelve a intentarlo en 15 minutos.",
    });
    expect(error).toMatchObject({
      status: 429,
      message: "Demasiados intentos. Vuelve a intentarlo en 15 minutos.",
    });
  });

  it("sin respuesta del servidor usa el mensaje de axios y estado 500", async () => {
    const offline: AxiosAdapter = async (config) => {
      throw new AxiosError("Network Error", "ERR_NETWORK", config);
    };
    const error = await apiClient.get("/tours", { adapter: offline }).catch((e: ApiError) => e);
    expect(error).toMatchObject({ status: 500, message: "Network Error" });
  });
});

describe("apiClient: sesión expirada (401)", () => {
  it("redirige a /login?expired=true con navegación dura", async () => {
    await failWith("/tours", 401, { error: "No autorizado o sesión expirada" });
    expect(replace).toHaveBeenCalledWith("/login?expired=true");
  });

  it("no redirige si el 401 viene del propio login (credenciales inválidas)", async () => {
    const error = await (async () => {
      try {
        await apiClient.post(
          "/auth/login",
          {},
          { adapter: respondWith(401, { error: "Credenciales inválidas" }) },
        );
      } catch (e) {
        return e as ApiError;
      }
    })();
    expect(error).toMatchObject({ status: 401, message: "Credenciales inválidas" });
    expect(replace).not.toHaveBeenCalled();
  });

  it("los demás errores no redirigen", async () => {
    await failWith("/tours", 403, { error: "No tienes acceso" });
    await failWith("/tours", 500, { error: "Error interno del servidor" });
    expect(replace).not.toHaveBeenCalled();
  });
});
