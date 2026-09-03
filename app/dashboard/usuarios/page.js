import { getUsuarioAtual } from "@/lib/authServer";
import { buscarUsuarios } from "@/lib/dataServer";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const [usuario, usuarios] = await Promise.all([getUsuarioAtual(), buscarUsuarios()]);
  return <UsuariosClient usuarioAtualId={usuario?.id} dadosIniciais={{ usuarios }} />;
}
