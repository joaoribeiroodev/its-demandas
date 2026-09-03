"use client";

import { useState } from "react";

const CORES = ["#8ac640", "#00335e", "#2c72ad", "#d97757", "#a855f7", "#00203d"];

export default function ProjetoModal({ projeto, onFechar, onSalvo }) {
  const editando = Boolean(projeto);
  const [nome, setNome] = useState(projeto?.nome || "");
  const [cor, setCor] = useState(projeto?.cor || CORES[0]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) {
      setErro("Dê um nome ao projeto.");
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch(editando ? `/api/projetos/${projeto.id}` : "/api/projetos", {
        method: editando ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: nome.trim(), cor }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível salvar.");
        return;
      }
      onSalvo(data.projeto);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-marine-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-6 sm:py-10 overflow-y-auto">
      <div className="card w-full max-w-sm p-5">
        <h2 className="font-display font-semibold text-marine-900 mb-4">
          {editando ? "Editar projeto" : "Novo projeto"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="label">Cor</label>
            <div className="flex gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCor(c)}
                  className="w-7 h-7 rounded-full border-2"
                  style={{ backgroundColor: c, borderColor: cor === c ? "#00203d" : "transparent" }}
                />
              ))}
            </div>
          </div>
          {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{erro}</p>}
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onFechar} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
