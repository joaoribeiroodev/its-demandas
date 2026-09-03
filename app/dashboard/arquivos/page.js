import { getUsuarioAtual } from "@/lib/authServer";
import { buscarDemandas } from "@/lib/dataServer";
import { buscarTodosArquivosVisiveis } from "@/lib/storageServer";
import ArquivosClient from "./ArquivosClient";

export default async function ArquivosPage() {
  const usuario = await getUsuarioAtual();
  const demandasVisiveis = await buscarDemandas(usuario);
  const arquivos = await buscarTodosArquivosVisiveis(usuario, demandasVisiveis);

  return <ArquivosClient usuarioAtual={usuario} dadosIniciais={{ arquivos }} />;
}
