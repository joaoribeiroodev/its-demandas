import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { buscarEquipe } from "@/lib/dataServer";

export async function GET() {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  try {
    const equipe = await buscarEquipe();
    return Response.json({ equipe });
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}
