import { getUsuarioAtual, respostaNaoAutenticado } from "@/lib/authServer";
import { buscarDemandas } from "@/lib/dataServer";
import { buscarArquivoPorId, gerarUrlDownload, removerArquivo } from "@/lib/storageServer";

export async function GET(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const arquivo = await buscarArquivoPorId(params.id);
  if (!arquivo) return Response.json({ erro: "Arquivo não encontrado." }, { status: 404 });

  if (arquivo.demanda_id) {
    const demandasVisiveis = await buscarDemandas(usuarioAtual);
    if (!demandasVisiveis.some((d) => d.id === arquivo.demanda_id)) {
      return Response.json({ erro: "Você não tem acesso a este arquivo." }, { status: 403 });
    }
  }
  // Arquivos vinculados a um projeto seguem a mesma visibilidade dos
  // projetos hoje: qualquer usuário autenticado pode acessar.

  try {
    const url = await gerarUrlDownload(arquivo.caminho_storage, arquivo.nome_original);
    return Response.redirect(url, 302);
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const usuarioAtual = await getUsuarioAtual();
  if (!usuarioAtual) return respostaNaoAutenticado();

  const arquivo = await buscarArquivoPorId(params.id);
  if (!arquivo) return Response.json({ erro: "Arquivo não encontrado." }, { status: 404 });

  const podeExcluir =
    usuarioAtual.permissao === "admin" ||
    usuarioAtual.permissao === "gestor" ||
    arquivo.enviado_por === usuarioAtual.id;

  if (!podeExcluir) {
    return Response.json({ erro: "Você só pode remover arquivos que você mesmo enviou." }, { status: 403 });
  }

  try {
    await removerArquivo(arquivo);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ erro: error.message }, { status: 500 });
  }
}
