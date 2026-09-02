import { getUsuarioAtual } from "@/lib/authServer";
import UsuariosClient from "./UsuariosClient";

export default async function UsuariosPage() {
  const usuario = await getUsuarioAtual();
  return <UsuariosClient usuarioAtualId={usuario?.id} />;
}
