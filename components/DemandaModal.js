"use client";

import { useEffect, useState } from "react";
import {
  PRIORIDADES,
  UNIDADES_PRAZO,
  STATUS_COLUNAS,
  SETORES_SUGERIDOS,
  formatarData,
} from "@/lib/demandaUtils";

const VAZIO = {
  titulo: "",
  descricao: "",
  setor: "",
  prioridade: "media",
  prazo_valor: 3,
  prazo_unidade: "dias",
  responsavel_id: "",
  status: "backlog",
};

export default function DemandaModal({ demanda, equipe, podeExcluir, onFechar, onSalvo, onExcluido }) {
  const editando = Boolean(demanda);
  const [form, setForm] = useState(editando ? mapDemandaParaForm(demanda) : VAZIO);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState("");

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
      setor: d.setor,
      prioridade: d.prioridade,
      prazo_valor: d.prazo_valor,
      prazo_unidade: d.prazo_unidade,
      responsavel_id: d.responsavel_id || "",
      status: d.status,
    };
  }

  function atualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    if (!form.titulo || !form.setor) {
      setErro("Preencha título e setor.");
      return;
    }
    setSalvando(true);
    try {
      const payload = { ...form, responsavel_id: form.responsavel_id || null };
      const res = await fetch(editando ? `/api/demandas/${demanda.id}` : "/api/demandas", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível salvar.");
        return;
      }
      onSalvo(data.demanda);
    } catch {
      setErro("Falha de conexão. Tente novamente.");
    } finally {
      setSalvando(false);
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

  return (
    <div className="fixed inset-0 z-50 bg-marine-900/40 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="card w-full max-w-2xl my-6">
        <div className="flex items-center justify-between px-5 py-4 border-b border-marine-100">
          <h2 className="font-display font-semibold text-marine-900">
            {editando ? "Editar demanda" : "Nova demanda"}
          </h2>
          <button onClick={onFechar} className="text-marine-400 hover:text-marine-700 text-xl leading-none">
            &times;
          </button>
        </div>

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

          <div>
            <label className="label">Descrição</label>
            <textarea
              className="input min-h-[90px] resize-y"
              value={form.descricao}
              onChange={(e) => atualizar("descricao", e.target.value)}
              placeholder="Detalhe o que precisa ser feito..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Setor</label>
              <input
                className="input"
                list="setores-sugeridos"
                value={form.setor}
                onChange={(e) => atualizar("setor", e.target.value)}
                placeholder="Ex.: TI"
                required
              />
              <datalist id="setores-sugeridos">
                {SETORES_SUGERIDOS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="label">Direcionado a</label>
              <select
                className="input"
                value={form.responsavel_id}
                onChange={(e) => atualizar("responsavel_id", e.target.value)}
              >
                <option value="">Sem responsável definido</option>
                {equipe.map((pessoa) => (
                  <option key={pessoa.id} value={pessoa.id}>
                    {pessoa.nome} — {pessoa.setor}
                  </option>
                ))}
              </select>
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
  );
}
