import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";

export async function GET() {
  const usuario = await getUsuarioAtual();
  if (!usuario) return respostaNaoAutenticado();
  return Response.json({ usuario });
}
