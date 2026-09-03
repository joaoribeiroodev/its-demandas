import { getUsuarioAtual } from "@/lib/authServer";
import { buscarProjetosComProgresso } from "@/lib/dataServer";
import ProjetosClient from "./ProjetosClient";

export default async function ProjetosPage() {
  const [usuario, projetos] = await Promise.all([getUsuarioAtual(), buscarProjetosComProgresso()]);
  return <ProjetosClient usuarioAtual={usuario} dadosIniciais={{ projetos }} />;
}
