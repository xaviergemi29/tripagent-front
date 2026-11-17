import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { metadata } from "../layout";

// next/font no corre en Vitest: solo interesa el `metadata` del layout.
vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "" }),
  Geist_Mono: () => ({ variable: "" }),
}));
import { metadata as registerMetadata } from "../register/page";

// La app está en español: `lang="en"` hacía que Chrome ofreciera traducir la página (y el
// traductor puede romper React) y que los lectores de pantalla leyeran con voz en inglés.

describe("Layout raíz", () => {
  it('declara lang="es-MX"', () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
    expect(source).toContain('lang="es-MX"');
    expect(source).not.toContain('lang="en"');
  });

  it("título por página con plantilla; el Magic Link no se indexa", () => {
    expect(metadata.title).toEqual({ default: "TripAgent", template: "%s · TripAgent" });
    expect(registerMetadata).toMatchObject({ title: "Tu reservación", robots: { index: false } });
  });
});
