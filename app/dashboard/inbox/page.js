import { getUsuarioAtual } from "@/lib/authServer";
import InboxClient from "./InboxClient";

export default async function InboxPage() {
  const usuario = await getUsuarioAtual();
  return <InboxClient usuarioAtual={usuario} />;
}
