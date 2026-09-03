import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas, buscarEquipe, buscarProjetosComProgresso } from "@/lib/dataServer";
import MeuDiaClient from "./MeuDiaClient";

export default async function MeuDiaPage() {
  const usuario = await getUsuarioAtual();
  const [demandas, equipe, projetos] = await Promise.all([
    buscarDemandas(usuario),
    buscarEquipe(),
    buscarProjetosComProgresso(),
  ]);

  return <MeuDiaClient usuarioAtual={usuario} dadosIniciais={{ demandas, equipe, projetos }} />;
}
