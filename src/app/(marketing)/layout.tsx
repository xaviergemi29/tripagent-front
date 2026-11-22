import { Plus_Jakarta_Sans } from "next/font/google";

// Tipografía de las páginas públicas de TripAgent (la misma que la landing).
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

/** Páginas públicas de TripAgent (términos, privacidad, contacto): fondo #faf8ff. */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${plusJakartaSans.className} flex min-h-screen flex-col bg-[#faf8ff]`}>
      {children}
    </div>
  );
}
