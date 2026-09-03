"use client";

import { useState } from "react";
import clsx from "clsx";

export default function SubtarefasChecklist({ demandaId, subtarefas, onMudou }) {
  const [novoTitulo, setNovoTitulo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const total = subtarefas.length;
  const concluidas = subtarefas.filter((s) => s.concluida).length;
  const progresso = total ? Math.round((concluidas / total) * 100) : 0;

  async function adicionar(e) {
    e.preventDefault();
    if (!novoTitulo.trim() || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch(`/api/demandas/${demandaId}/subtarefas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: novoTitulo.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        onMudou([...subtarefas, data.subtarefa]);
        setNovoTitulo("");
      }
    } finally {
      setEnviando(false);
    }
  }

  async function alternar(subtarefa) {
    onMudou(subtarefas.map((s) => (s.id === subtarefa.id ? { ...s, concluida: !s.concluida } : s)));
    await fetch(`/api/demandas/${demandaId}/subtarefas/${subtarefa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concluida: !subtarefa.concluida }),
    });
  }

  async function remover(subtarefa) {
    onMudou(subtarefas.filter((s) => s.id !== subtarefa.id));
    await fetch(`/api/demandas/${demandaId}/subtarefas/${subtarefa.id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="label mb-0">Subtarefas</span>
        {total > 0 && (
          <span className="text-[11px] text-marine-400">
            {concluidas}/{total} concluídas
          </span>
        )}
      </div>

      {total > 0 && (
        <div className="h-1.5 w-full rounded-full bg-marine-100 mb-3 overflow-hidden">
          <div className="h-full bg-tide-500 transition-all" style={{ width: `${progresso}%` }} />
        </div>
      )}

      <ul className="space-y-1.5 mb-2">
        {subtarefas
          .slice()
          .sort((a, b) => a.ordem - b.ordem)
          .map((s) => (
            <li key={s.id} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={s.concluida}
                onChange={() => alternar(s)}
                className="w-4 h-4 rounded border-marine-300 text-tide-600 focus:ring-tide-500"
              />
              <span className={clsx("text-sm flex-1", s.concluida && "line-through text-marine-400")}>
                {s.titulo}
              </span>
              <button
                type="button"
                onClick={() => remover(s)}
                className="text-marine-300 hover:text-red-500 opacity-0 group-hover:opacity-100 text-xs"
              >
                remover
              </button>
            </li>
          ))}
      </ul>

      <form onSubmit={adicionar} className="flex gap-2">
        <input
          className="input text-sm"
          placeholder="Nova subtarefa..."
          value={novoTitulo}
          onChange={(e) => setNovoTitulo(e.target.value)}
        />
        <button type="submit" className="btn-ghost text-xs shrink-0" disabled={!novoTitulo.trim() || enviando}>
          + Adicionar
        </button>
      </form>
    </div>
  );
}
