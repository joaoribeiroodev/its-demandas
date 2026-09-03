import { buscarProjetosComProgresso } from "@/lib/dataServer";
import ProjetosClient from "./ProjetosClient";

export default async function ProjetosPage() {
  const projetos = await buscarProjetosComProgresso();
  return <ProjetosClient dadosIniciais={{ projetos }} />;
}
