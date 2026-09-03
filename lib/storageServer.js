import { randomUUID } from "crypto";
import { supabaseAdmin } from "./supabaseAdmin";

export const BUCKET_ANEXOS = "anexos";
export const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024; // 5 MB

// Extensões bloqueadas por segurança (executáveis e scripts). Uma lista de
// bloqueio simples é suficiente aqui: o objetivo é impedir o caso óbvio de
// alguém anexar um executável por engano ou má-fé, não é uma sandbox de
// segurança contra malware sofisticado.
const EXTENSOES_BLOQUEADAS = [
  "exe", "bat", "cmd", "com", "msi", "sh", "bash", "ps1", "vbs", "js", "jar", "app", "dll",
];

export function extensaoBloqueada(nomeArquivo) {
  const ext = nomeArquivo.split(".").pop()?.toLowerCase();
  return EXTENSOES_BLOQUEADAS.includes(ext);
}

function sanitizarNomeArquivo(nome) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-140);
}

const SELECT_ARQUIVO =
  "id, nome_original, tipo_mime, tamanho_bytes, demanda_id, projeto_id, created_at, enviado_por:enviado_por(id, nome)";

/** Envia o arquivo para o Storage e grava o registro na tabela `arquivos`. */
export async function enviarArquivo({ buffer, nomeOriginal, tipoMime, usuarioId, demandaId, projetoId }) {
  const supabase = supabaseAdmin();
  const nomeSeguro = sanitizarNomeArquivo(nomeOriginal);
  const pasta = demandaId ? `demandas/${demandaId}` : `projetos/${projetoId}`;
  const caminho = `${pasta}/${randomUUID()}-${nomeSeguro}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .upload(caminho, buffer, { contentType: tipoMime || "application/octet-stream", upsert: false });

  if (erroUpload) throw new Error(erroUpload.message);

  const { data, error } = await supabase
    .from("arquivos")
    .insert({
      nome_original: nomeOriginal,
      caminho_storage: caminho,
      tipo_mime: tipoMime || null,
      tamanho_bytes: buffer.length,
      demanda_id: demandaId || null,
      projeto_id: projetoId || null,
      enviado_por: usuarioId,
    })
    .select(SELECT_ARQUIVO)
    .single();

  if (error) {
    // Se falhar ao gravar o registro, remove o arquivo órfão do Storage.
    await supabase.storage.from(BUCKET_ANEXOS).remove([caminho]);
    throw new Error(error.message);
  }

  return data;
}

export async function buscarArquivosDeDemanda(demandaId) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("arquivos")
    .select(SELECT_ARQUIVO)
    .eq("demanda_id", demandaId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function buscarArquivosDeProjeto(projetoId) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("arquivos")
    .select(SELECT_ARQUIVO)
    .eq("projeto_id", projetoId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Busca todos os arquivos visíveis para um usuário, para a aba "Arquivos".
 * Um arquivo vinculado a uma demanda segue a mesma regra de visibilidade
 * daquela demanda; um arquivo vinculado a um projeto é visível a todos
 * (projetos, hoje, não têm restrição de visibilidade no sistema).
 */
export async function buscarTodosArquivosVisiveis(usuarioAtual, demandasVisiveis) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("arquivos")
    .select(
      `${SELECT_ARQUIVO}, demanda:demanda_id(id, titulo, equipe, setor), projeto:projeto_id(id, nome, cor)`
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const idsDemandasVisiveis = new Set(demandasVisiveis.map((d) => d.id));
  return (data || []).filter((a) => a.projeto_id || idsDemandasVisiveis.has(a.demanda_id));
}

export async function buscarArquivoPorId(id) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.from("arquivos").select("*").eq("id", id).single();
  if (error) return null;
  return data;
}

export async function gerarUrlDownload(caminho, nomeOriginal) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrl(caminho, 60, { download: nomeOriginal });
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function removerArquivo(arquivo) {
  const supabase = supabaseAdmin();
  await supabase.storage.from(BUCKET_ANEXOS).remove([arquivo.caminho_storage]);
  const { error } = await supabase.from("arquivos").delete().eq("id", arquivo.id);
  if (error) throw new Error(error.message);
}
