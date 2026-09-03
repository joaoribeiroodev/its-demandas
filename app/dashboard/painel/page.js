import { getUsuarioAtual } from "@/lib/authServer";
import PainelClient from "./PainelClient";

export default async function PainelPage() {
  const usuario = await getUsuarioAtual();
  return <PainelClient usuarioAtual={usuario} />;
}
