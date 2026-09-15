import { redirect } from "next/navigation";

export default function Home() {
  // Aquí es donde en el futuro inyectarás la validación de sesión:
  // const session = await getSession();
  // if (!session) redirect('/login');

  // Por ahora, redirigimos limpiamente y sin latencia al módulo principal
  redirect("/tours");
}
