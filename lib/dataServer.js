import { supabaseAdmin } from "./supabaseAdmin";
import { SELECT_DEMANDA } from "./demandaUtils";

/**
 * Busca as demandas visíveis para um usuário:
 * - Demandas pessoais (equipe = false) só aparecem para quem criou ou para
 *   quem foi atribuído como responsável.
 * - Demandas de equipe (equipe = true) aparecem para quem é do mesmo setor.
 * - Admin/gestor enxergam tudo, de qualquer setor ou dono (mesmo papel de
 *   supervisão que já têm hoje sobre excluir qualquer demanda).
 *
 * Usada tanto pela rota GET /api/demandas quanto diretamente pelas páginas
 * (Server Components), evitando que a página precise dar uma volta a mais
 * chamando a própria API para conseguir os dados do primeiro carregamento.
 */
export async function buscarDemandas(usuarioAtual) {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("demandas")
    .select(SELECT_DEMANDA)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const todas = data || [];
  if (!usuarioAtual) return todas;
  if (["admin", "gestor"].includes(usuarioAtual.permissao)) return todas;

  return todas.filter((d) =>
    d.equipe
      ? d.setor === usuarioAtual.setor
      : d.criado_por === usuarioAtual.id || d.responsavel_id === usuarioAtual.id
  );
}

export async function buscarEquipe() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, setor")
    .eq("ativo", true)
    .order("nome", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function buscarProjetosComProgresso() {
  const supabase = supabaseAdmin();
  const { data: projetos, error } = await supabase
    .from("projetos")
    .select("id, nome, cor, ativo, created_at")
    .eq("ativo", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const { data: demandas } = await supabase
    .from("demandas")
    .select("id, projeto_id, status")
    .not("projeto_id", "is", null);

  return projetos.map((projeto) => {
    const itens = (demandas || []).filter((d) => d.projeto_id === projeto.id);
    const concluidas = itens.filter((d) => d.status === "concluido").length;
    return {
      ...projeto,
      total_demandas: itens.length,
      demandas_concluidas: concluidas,
      progresso: itens.length ? Math.round((concluidas / itens.length) * 100) : 0,
    };
  });
}

export async function buscarUsuarios() {
  const supabase = supabaseAdmin();
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, login, setor, permissao, ativo, created_at")
    .order("nome", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}
