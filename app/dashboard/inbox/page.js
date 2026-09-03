import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas, buscarEquipe, buscarProjetosComProgresso } from "@/lib/dataServer";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
  const usuario = await getUsuarioAtual();
  const [demandas, equipe, projetos] = await Promise.all([
    buscarDemandas(usuario),
    buscarEquipe(),
    buscarProjetosComProgresso(),
  ]);

  return (
    <InboxClient
      usuarioAtual={usuario}
      dadosIniciais={{ itens: demandas.filter((d) => d.status === "inbox"), equipe, projetos }}
    />
  );
}
