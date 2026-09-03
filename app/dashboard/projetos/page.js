import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas, buscarEquipe, buscarProjetosComProgresso } from "@/lib/dataServer";
import ProjetosClient from "./ProjetosClient";

export default async function ProjetosPage() {
  const usuario = await getUsuarioAtual();
  const [projetos, demandas, equipe] = await Promise.all([
    buscarProjetosComProgresso(),
    buscarDemandas(usuario),
    buscarEquipe(),
  ]);
  return <ProjetosClient usuarioAtual={usuario} dadosIniciais={{ projetos, demandas, equipe }} />;
}
