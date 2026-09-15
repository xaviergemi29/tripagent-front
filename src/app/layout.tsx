import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google" // O 'Inter' según prefieras
// import { Toaster } from "sonner"
import { ReactQueryProvider } from "@/providers/ReactQueryProvider"
import "./globals.css"
import { Toaster } from "sonner";

// Configuramos la fuente desde Google Fonts vía Next.js
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TripAgent | Panel de Administración",
  description: "Plataforma de gestión para guías y agencias de tours",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
         {/* Envolvemos la app con el cliente de estado asíncrono */}
        <ReactQueryProvider>
          {children}
          {/* <Toaster richColors position="bottom-right" /> */}
        </ReactQueryProvider>
        {/* CRÍTICO: Debe ir fuera del provider de páginas, preferiblemente al final del body */}
        <Toaster position="bottom-right" richColors closeButton />
      </body>
    </html>
  )
}
