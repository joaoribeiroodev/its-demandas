"use client";

import { useEffect, useState } from "react";
import {
  PRIORIDADES,
  UNIDADES_PRAZO,
  STATUS_COLUNAS,
  SETORES_SUGERIDOS,
  NIVEIS_ENERGIA,
  formatarData,
  hojeISO,
  descreverRecorrencia,
} from "@/lib/demandaUtils";
import TagsInput from "./TagsInput";
import SubtarefasChecklist from "./SubtarefasChecklist";
import AnexosList from "./AnexosList";
import NotasMarkdown from "./NotasMarkdown";
import PomodoroTimer from "./PomodoroTimer";
import SnoozeMenu from "./SnoozeMenu";
import RecorrenciaEditor from "./RecorrenciaEditor";

const VAZIO = {
  titulo: "",
  descricao: "",
  setor: "",
  setor_direcionado: "",
  prioridade: "media",
  prazo_valor: 3,
  prazo_unidade: "dias",
  responsavel_id: "",
  status: "backlog",
  tags: [],
  energia: "",
  duracao_estimada_min: "",
  foco_dia_data: "",
  projeto_id: "",
  recorrencia_regra: null,
  equipe: false,
};

export default function DemandaModal({ demanda, equipe, projetos, usuarioAtual, onFechar, onSalvo, onExcluido }) {
  const editando = Boolean(demanda);
  const [form, setForm] = useState(editando ? mapDemandaParaForm(demanda) : VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [subtarefas, setSubtarefas] = useState(demanda?.subtarefas || []);
  const [mostrarPomodoro, setMostrarPomodoro] = useState(false);

  const ehGestorOuAdmin = ["admin", "gestor"].includes(usuarioAtual?.permissao);
  const ehEquipeExistente = Boolean(demanda?.equipe);
  // Colaborador vendo uma demanda de equipe já existente: pode editar quase
  // tudo, menos trocar o responsável ou o setor (isso é do gestor).
  const camposDeEquipeTravados = editando && ehEquipeExistente && !ehGestorOuAdmin;
  const setoresReais = Array.from(new Set((equipe || []).map((p) => p.setor).filter(Boolean))).sort();

  const podeExcluir =
    ehGestorOuAdmin || (editando && !demanda.equipe && demanda.criado_por === usuarioAtual?.id);

  useEffect(() => {
    if (!editando) return;
    fetch(`/api/demandas/${demanda.id}/comentarios`)
      .then((r) => r.json())
      .then((data) => setComentarios(data.comentarios || []))
      .catch(() => {});
  }, [editando, demanda]);

  function mapDemandaParaForm(d) {
    return {
      titulo: d.titulo,
      descricao: d.descricao || "",
      setor: d.setor || "",
      setor_direcionado: d.setor_direcionado || "",
      prioridade: d.prioridade,
      prazo_valor: d.prazo_valor || 3,
      prazo_unidade: d.prazo_unidade || "dias",
      responsavel_id: d.responsavel_id || "",
      status: d.status === "inbox" ? "backlog" : d.status,
      tags: d.tags || [],
      energia: d.energia || "",
      duracao_estimada_min: d.duracao_estimada_min || "",
      foco_dia_data: d.foco_dia_data || "",
      projeto_id: d.projeto_id || "",
      recorrencia_regra: d.recorrente ? d.recorrencia_regra : null,
      equipe: Boolean(d.equipe),
    };
  }

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function montarPayload() {
    const payload = {
      titulo: form.titulo,
      descricao: form.descricao,
      setor: form.setor || null,
      setor_direcionado: form.setor_direcionado || null,
      prioridade: form.prioridade,
      prazo_valor: form.prazo_valor || null,
      prazo_unidade: form.prazo_unidade || null,
      responsavel_id: form.responsavel_id || null,
      status: form.status,
      tags: form.tags,
      energia: form.energia || null,
      duracao_estimada_min: form.duracao_estimada_min ? Number(form.duracao_estimada_min) : null,
      foco_dia_data: form.foco_dia_data || null,
      projeto_id: form.projeto_id || null,
      recorrente: Boolean(form.recorrencia_regra),
      recorrencia_regra: form.recorrencia_regra || null,
    };
    // "equipe" só é definido na criação — depois de criada, o tipo da
    // demanda não muda mais (evita casos estranhos de converter pessoal
    // em equipe e vice-versa no meio do caminho).
    if (!editando) payload.equipe = form.equipe;
    return payload;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!form.titulo) {
      setErro("Escreva um título para a tarefa.");
      return;
    }
    if (form.equipe && !form.setor) {
      setErro("Escolha o setor responsável por esta demanda de equipe.");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(editando ? `/api/demandas/${demanda.id}` : "/api/demandas", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(montarPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível salvar.");
        return;
      }
      onSalvo(data.demanda, data.proximaOcorrencia || null);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  async function handlePatchRapido(campos) {
    const res = await fetch(`/api/demandas/${demanda.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    const data = await res.json();
    if (res.ok) {
      setForm((f) => ({ ...f, ...campos }));
      onSalvo(data.demanda, data.proximaOcorrencia || null);
    }
  }

  async function handleExcluir() {
    if (!confirm("Excluir esta demanda? Essa ação não pode ser desfeita.")) return;
    const res = await fetch(`/api/demandas/${demanda.id}`, { method: "DELETE" });
    if (res.ok) onExcluido(demanda.id);
  }

  async function handleComentar(e) {
    e.preventDefault();
    if (!novoComentario.trim()) return;
    const res = await fetch(`/api/demandas/${demanda.id}/comentarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: novoComentario.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setComentarios((c) => [...c, data.comentario]);
      setNovoComentario("");
    }
  }

  const noMeuDia = form.foco_dia_data === hojeISO();

  return (
    <div className="fixed inset-0 z-50 bg-marine-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="card w-full max-w-2xl flex flex-col max-h-[calc(100vh-3rem)]">
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-marine-100">
          <div className="flex items-center gap-2">
            <h2 className="font-display font-semibold text-marine-900">
              {editando ? "Editar demanda" : "Nova demanda"}
            </h2>
            {ehEquipeExistente && (
              <span className="inline-flex items-center gap-1 rounded-full bg-marine-50 text-marine-700 text-[11px] font-medium px-2 py-0.5">
                👥 Equipe · {demanda.setor}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {editando && (
              <SnoozeMenu onAdiar={(dataAlvo) => handlePatchRapido({ foco_dia_data: dataAlvo })} />
            )}
            <button onClick={onFechar} className="text-marine-400 hover:text-marine-700 text-xl leading-none">
              &times;
            </button>
          </div>
        </div>

        <div className="overflow-y-auto min-h-0 flex-1">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="label">Título</label>
            <input
              className="input"
              value={form.titulo}
              onChange={(e) => atualizar("titulo", e.target.value)}
              placeholder="Ex.: Ajustar layout do módulo de faturamento"
              required
            />
          </div>

          <NotasMarkdown value={form.descricao} onChange={(v) => atualizar("descricao", v)} />

          <div>
            <label className="label">Tags de contexto</label>
            <TagsInput tags={form.tags} onChange={(t) => atualizar("tags", t)} />
          </div>

          {!editando && ehGestorOuAdmin && (
            <label className="flex items-start gap-2.5 text-sm text-marine-700 bg-marine-50 rounded-lg px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.equipe}
                onChange={(e) => atualizar("equipe", e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-marine-300 text-tide-600 focus:ring-tide-500"
              />
              <span>
                <span className="font-medium">Demanda em equipe</span> — fica visível para todo mundo do setor
                escolhido abaixo. Só gestores e administradores podem excluí-la ou atribuí-la a uma pessoa
                específica depois.
              </span>
            </label>
          )}

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Setor Responsável</label>
              {camposDeEquipeTravados ? (
                <input className="input bg-marine-50 text-marine-500" value={form.setor} disabled />
              ) : form.equipe ? (
                <select className="input" value={form.setor} onChange={(e) => atualizar("setor", e.target.value)} required>
                  <option value="">Selecione o setor...</option>
                  {setoresReais.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <>
                  <input
                    className="input"
                    list="setores-sugeridos"
                    value={form.setor}
                    onChange={(e) => atualizar("setor", e.target.value)}
                    placeholder="Opcional"
                  />
                  <datalist id="setores-sugeridos">
                    {SETORES_SUGERIDOS.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </>
              )}
            </div>

            <div>
              <label className="label">Setor Direcionado</label>
              <input
                className="input"
                list="setores-sugeridos-direcionado"
                value={form.setor_direcionado}
                onChange={(e) => atualizar("setor_direcionado", e.target.value)}
                placeholder="Quem pediu/precisa"
              />
              <datalist id="setores-sugeridos-direcionado">
                {Array.from(new Set([...SETORES_SUGERIDOS, ...setoresReais]))
                  .sort()
                  .map((s) => (
                    <option key={s} value={s} />
                  ))}
              </datalist>
              <p className="text-[11px] text-marine-400 mt-1">O setor que solicitou esta demanda.</p>
            </div>

            <div>
              <label className="label">Direcionado a</label>
              <select
                className="input disabled:bg-marine-50 disabled:text-marine-500"
                value={form.responsavel_id}
                onChange={(e) => atualizar("responsavel_id", e.target.value)}
                disabled={camposDeEquipeTravados}
              >
                <option value="">Sem responsável definido</option>
                {equipe.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome} — {pessoa.setor}
                  </option>
                ))}
              </select>
              {camposDeEquipeTravados && (
                <p className="text-[11px] text-marine-400 mt-1">
                  Só gestores e administradores podem atribuir esta demanda a uma pessoa específica.
                </p>
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Prioridade</label>
              <select
                className="input"
                value={form.prioridade}
                onChange={(e) => atualizar("prioridade", e.target.value)}
              >
                {PRIORIDADES.map((p) => (
                  <option key={p.valor} value={p.valor}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Energia necessária</label>
              <select className="input" value={form.energia} onChange={(e) => atualizar("energia", e.target.value)}>
                <option value="">Não definida</option>
                {NIVEIS_ENERGIA.map((n) => (
                  <option key={n.valor} value={n.valor}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Duração estimada (min)</label>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Ex.: 30"
                value={form.duracao_estimada_min}
                onChange={(e) => atualizar("duracao_estimada_min", e.target.value)}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Prazo</label>
              <input
                type="number"
                min={1}
                className="input"
                value={form.prazo_valor}
                onChange={(e) => atualizar("prazo_valor", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="label">Unidade</label>
              <select
                className="input"
                value={form.prazo_unidade}
                onChange={(e) => atualizar("prazo_unidade", e.target.value)}
              >
                {UNIDADES_PRAZO.map((u) => (
                  <option key={u.valor} value={u.valor}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Projeto</label>
              <select className="input" value={form.projeto_id} onChange={(e) => atualizar("projeto_id", e.target.value)}>
                <option value="">Sem projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <RecorrenciaEditor
                regra={form.recorrencia_regra}
                onChange={(r) => atualizar("recorrencia_regra", r)}
              />
              {form.recorrencia_regra && (
                <p className="text-[11px] text-tide-700 mt-1.5">
                  🔁 {descreverRecorrencia(form.recorrencia_regra)}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm text-marine-700 pb-2">
              <input
                type="checkbox"
                checked={noMeuDia}
                onChange={(e) => atualizar("foco_dia_data", e.target.checked ? hojeISO() : "")}
                className="w-4 h-4 rounded border-marine-300 text-tide-600 focus:ring-tide-500"
              />
              Colocar em &quot;Meu Dia&quot; (hoje)
            </label>
          </div>

          {editando && (
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => atualizar("status", e.target.value)}
              >
                {STATUS_COLUNAS.map((s) => (
                  <option key={s.valor} value={s.valor}>
                    {s.label}
                  </option>
                ))}
              </select>
              {demanda.prazo_data && (
                <p className="text-xs text-marine-400 mt-1">
                  Prazo alvo atual: {formatarData(demanda.prazo_data)}
                </p>
              )}
            </div>
          )}

          {editando && (
            <div className="border-t border-marine-100 pt-4">
              <SubtarefasChecklist demandaId={demanda.id} subtarefas={subtarefas} onMudou={setSubtarefas} />
            </div>
          )}

          {editando && (
            <div className="border-t border-marine-100 pt-4">
              <AnexosList demandaId={demanda.id} usuarioAtual={usuarioAtual} />
            </div>
          )}

          {editando && (
            <div className="border-t border-marine-100 pt-4">
              <button
                type="button"
                onClick={() => setMostrarPomodoro((m) => !m)}
                className="text-xs font-medium text-tide-700 hover:text-tide-800"
              >
                {mostrarPomodoro ? "Ocultar modo foco" : "▸ Abrir modo foco (Pomodoro)"}
              </button>
              {mostrarPomodoro && (
                <div className="mt-3">
                  <PomodoroTimer />
                </div>
              )}
            </div>
          )}

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {erro}
            </p>
          )}

          <div className="flex items-center justify-between pt-2">
            <div>
              {editando && podeExcluir && (
                <button type="button" onClick={handleExcluir} className="btn-danger">
                  Excluir
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={onFechar} className="btn-ghost">
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? "Salvando..." : editando ? "Salvar alterações" : "Criar demanda"}
              </button>
            </div>
          </div>
        </form>

        {editando && (
          <div className="border-t border-marine-100 p-5">
            <h3 className="text-sm font-semibold text-marine-800 mb-3">Acompanhamento</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
              {comentarios.length === 0 && (
                <p className="text-xs text-marine-400">Nenhum comentário ainda.</p>
              )}
              {comentarios.map((c) => (
                <div key={c.id} className="text-sm bg-marine-50 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-marine-800 text-xs">{c.autor?.nome || "Usuário"}</span>
                    <span className="text-[11px] text-marine-400">
                      {new Date(c.created_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-marine-700">{c.mensagem}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleComentar} className="flex gap-2">
              <input
                className="input"
                placeholder="Escreva uma atualização..."
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
              />
              <button type="submit" className="btn-secondary shrink-0">
                Enviar
              </button>
            </form>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
