import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas } from "@/lib/dataServer";
import LogbookClient from "./LogbookClient";

export default async function LogbookPage() {
  const usuario = await getUsuarioAtual();
  const demandas = await buscarDemandas(usuario);
  return <LogbookClient dadosIniciais={{ concluidas: demandas.filter((d) => d.status === "concluido") }} />;
}
