import { getUsuarioAtual } from "@/lib/authServer";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const usuario = await getUsuarioAtual();
  return <DashboardClient usuarioAtual={usuario} />;
}
