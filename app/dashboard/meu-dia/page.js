import { getUsuarioAtual } from "@/lib/authServer";
import MeuDiaClient from "./MeuDiaClient";

export default async function MeuDiaPage() {
  const usuario = await getUsuarioAtual();
  return <MeuDiaClient usuarioAtual={usuario} />;
}
