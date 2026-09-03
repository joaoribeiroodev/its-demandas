import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { buscarDemandas } from "@/lib/dataServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  enviarArquivo,
  buscarArquivosDeDemanda,
  buscarArquivosDeProjeto,
  buscarTodosArquivosVisiveis,
  extensaoBloqueada,
  TAMANHO_MAXIMO_BYTES,
} from "@/lib/storageServer";

export async function GET(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const { searchParams } = new URL(request.url);
  const demandaId = searchParams.get("demanda_id");
  const projetoId = searchParams.get("projeto_id");

  try {
    if (demandaId) {
      const demandasVisiveis = await buscarDemandas(usuarioAtual);
      if (!demandasVisiveis.some((d) => d.id === demandaId)) {
        return Response.json({ erro: "Você não tem acesso a esta demanda." }, { status: 403 });
      }
      const arquivos = await buscarArquivosDeDemanda(demandaId);
      return Response.json({ arquivos });
    }

    if (projetoId) {
      const arquivos = await buscarArquivosDeProjeto(projetoId);
      return Response.json({ arquivos });
    }

    // Sem filtro: lista tudo que o usuário pode ver — usado pela aba "Arquivos".
    const demandasVisiveis = await buscarDemandas(usuarioAtual);
    const arquivos = await buscarTodosArquivosVisiveis(usuarioAtual, demandasVisiveis);
    return Response.json({ arquivos });
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const formData = await request.formData().catch(() => null);
  if (!formData) return Response.json({ erro: "Requisição inválida." }, { status: 400 });

  const arquivo = formData.get("arquivo");
  const demandaId = formData.get("demanda_id") || null;
  const projetoId = formData.get("projeto_id") || null;

  if (!arquivo || typeof arquivo === "string") {
    return Response.json({ erro: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (!demandaId && !projetoId) {
    return Response.json({ erro: "Informe a demanda ou o projeto ao qual o arquivo pertence." }, { status: 400 });
  }
  if (demandaId && projetoId) {
    return Response.json({ erro: "Um arquivo pertence a uma demanda OU a um projeto, não aos dois." }, { status: 400 });
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return Response.json(
      { erro: `Arquivo muito grande. O limite é ${Math.round(TAMANHO_MAXIMO_BYTES / 1024 / 1024)}MB.` },
      { status: 400 }
    );
  }
  if (extensaoBloqueada(arquivo.name)) {
    return Response.json({ erro: "Este tipo de arquivo não é permitido por segurança." }, { status: 400 });
  }

  // Confere se o usuário realmente tem acesso ao destino do anexo.
  if (demandaId) {
    const demandasVisiveis = await buscarDemandas(usuarioAtual);
    if (!demandasVisiveis.some((d) => d.id === demandaId)) {
      return Response.json({ erro: "Você não tem acesso a esta demanda." }, { status: 403 });
    }
  } else {
    const supabase = supabaseAdmin();
    const { data: projeto } = await supabase.from("projetos").select("id").eq("id", projetoId).single();
    if (!projeto) return Response.json({ erro: "Projeto não encontrado." }, { status: 404 });
  }

  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const registro = await enviarArquivo({
      buffer,
      nomeOriginal: arquivo.name,
      tipoMime: arquivo.type,
      usuarioId: usuarioAtual.id,
      demandaId,
      projetoId,
    });
    return Response.json({ arquivo: registro }, { status: 201 });
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}
