import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas } from "@/lib/dataServer";
import PainelClient from "./PainelClient";

export default async function PainelPage() {
  const usuario = await getUsuarioAtual();
  const demandas = await buscarDemandas(usuario);
  return <PainelClient usuarioAtual={usuario} dadosIniciais={{ demandas }} />;
}
