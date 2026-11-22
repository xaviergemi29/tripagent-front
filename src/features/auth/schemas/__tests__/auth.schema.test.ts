import { describe, expect, it } from "vitest";
import { loginSchema } from "../login.schema";
import { changePasswordSchema } from "../security.schema";
import { userProfileSchema } from "../session.schema";

const pathsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  result.success ? [] : result.error!.issues.map((i) => i.path.join("."));

describe("loginSchema", () => {
  it("acepta correo y contraseña de 6+ caracteres", () => {
    expect(loginSchema.parse({ email: "ana@agencia.mx", password: "secreta" })).toEqual({
      email: "ana@agencia.mx",
      password: "secreta",
    });
  });

  it("recorta espacios y pasa a minúsculas ANTES de validar (corregido el 2026-11-22)", () => {
    // Antes `z.email().trim()` validaba primero y rechazaba a quien pegaba el correo con un espacio.
    expect(loginSchema.parse({ email: " Ana@Agencia.MX ", password: "secreta" })).toEqual({
      email: "ana@agencia.mx",
      password: "secreta",
    });
  });

  it("rechaza correo inválido y contraseña corta (misma regla que la API)", () => {
    expect(pathsOf(loginSchema.safeParse({ email: "ana", password: "secreta" }))).toEqual([
      "email",
    ]);
    expect(pathsOf(loginSchema.safeParse({ email: "ana@agencia.mx", password: "12345" }))).toEqual([
      "password",
    ]);
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "anterior1",
    newPassword: "nueva123",
    confirmPassword: "nueva123",
  };

  it("acepta un cambio válido", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("la confirmación debe coincidir", () => {
    expect(
      pathsOf(changePasswordSchema.safeParse({ ...valid, confirmPassword: "otra1234" })),
    ).toEqual(["confirmPassword"]);
  });

  it("la nueva contraseña no puede ser igual a la actual", () => {
    const same = {
      currentPassword: "nueva123",
      newPassword: "nueva123",
      confirmPassword: "nueva123",
    };
    expect(pathsOf(changePasswordSchema.safeParse(same))).toEqual(["newPassword"]);
  });

  it("todas deben tener al menos 6 caracteres", () => {
    expect(
      pathsOf(
        changePasswordSchema.safeParse({
          currentPassword: "1",
          newPassword: "2",
          confirmPassword: "2",
        }),
      ),
    ).toEqual(expect.arrayContaining(["currentPassword", "newPassword", "confirmPassword"]));
  });
});

describe("userProfileSchema (GET /auth/me)", () => {
  const profile = {
    id: "11111111-1111-4111-8111-111111111111",
    email: "ana@agencia.mx",
    fullName: "Ana Torres",
    role: "ADMIN",
    agencyId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    agencyName: "Viajes Xalapa",
  };

  it("el logotipo es opcional y puede ser null", () => {
    expect(userProfileSchema.safeParse(profile).success).toBe(true);
    expect(userProfileSchema.safeParse({ ...profile, agencyLogoPath: null }).success).toBe(true);
    expect(
      userProfileSchema.safeParse({ ...profile, agencyLogoPath: "/uploads/logos/a.png" }).success,
    ).toBe(true);
  });

  it("rechaza una respuesta sin agencia", () => {
    const { agencyId, ...withoutAgency } = profile;
    void agencyId;
    expect(pathsOf(userProfileSchema.safeParse(withoutAgency))).toContain("agencyId");
  });
});
