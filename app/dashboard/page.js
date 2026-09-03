import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas, buscarEquipe, buscarProjetosComProgresso } from "@/lib/dataServer";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const usuario = await getUsuarioAtual();
  const [demandas, equipe, projetos] = await Promise.all([
    buscarDemandas(usuario),
    buscarEquipe(),
    buscarProjetosComProgresso(),
  ]);

  return (
    <DashboardClient
      usuarioAtual={usuario}
      dadosIniciais={{ demandas: demandas.filter((d) => d.status !== "inbox"), equipe, projetos }}
    />
  );
}
