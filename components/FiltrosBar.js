"use client";

import { PRIORIDADES } from "@/lib/demandaUtils";

export default function FiltrosBar({ filtros, setFiltros, setores, equipe, onNovaDemanda }) {
  function atualizar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-6 py-4">
      <input
        className="input sm:max-w-xs"
        placeholder="Buscar por título..."
        value={filtros.busca}
        onChange={(e) => atualizar("busca", e.target.value)}
      />

      <select className="input sm:w-40" value={filtros.setor} onChange={(e) => atualizar("setor", e.target.value)}>
        <option value="">Todos os setores</option>
        {setores.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className="input sm:w-40"
        value={filtros.prioridade}
        onChange={(e) => atualizar("prioridade", e.target.value)}
      >
        <option value="">Toda prioridade</option>
        {PRIORIDADES.map((p) => (
          <option key={p.valor} value={p.valor}>
            {p.label}
          </option>
        ))}
      </select>

      <select
        className="input sm:w-48"
        value={filtros.responsavel}
        onChange={(e) => atualizar("responsavel", e.target.value)}
      >
        <option value="">Todos os responsáveis</option>
        {equipe.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <button onClick={onNovaDemanda} className="btn-primary sm:ml-auto">
        + Nova demanda
      </button>
    </div>
  );
}
