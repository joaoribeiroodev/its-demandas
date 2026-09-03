import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas, buscarEquipe, buscarProjetosComProgresso } from "@/lib/dataServer";
import LogbookClient from "./LogbookClient";

export default async function LogbookPage() {
  const usuario = await getUsuarioAtual();
  const [demandas, equipe, projetos] = await Promise.all([
    buscarDemandas(usuario),
    buscarEquipe(),
    buscarProjetosComProgresso(),
  ]);

  return (
    <LogbookClient
      usuarioAtual={usuario}
      dadosIniciais={{ concluidas: demandas.filter((d) => d.status === "concluido"), equipe, projetos }}
    />
  );
}
