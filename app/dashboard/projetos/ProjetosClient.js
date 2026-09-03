"use client";

import { useState } from "react";
import ProjetoModal from "./ProjetoModal";

export default function ProjetosClient({ dadosIniciais }) {
  const [projetos, setProjetos] = useState(dadosIniciais?.projetos || []);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  async function carregar() {
    const res = await fetch("/api/projetos");
    const data = await res.json();
    setProjetos(data.projetos || []);
  }

  function handleSalvo(projetoSalvo) {
    setProjetos((atual) => {
      const existe = atual.some((p) => p.id === projetoSalvo.id);
      return existe
        ? atual.map((p) => (p.id === projetoSalvo.id ? { ...p, ...projetoSalvo } : p))
        : [{ ...projetoSalvo, total_demandas: 0, demandas_concluidas: 0, progresso: 0 }, ...atual];
    });
    setModalAberto(false);
    setEditando(null);
  }

  async function handleArquivar(projeto) {
    if (!confirm(`Arquivar o projeto "${projeto.nome}"? As demandas vinculadas continuam existindo.`)) return;
    const res = await fetch(`/api/projetos/${projeto.id}`, { method: "DELETE" });
    if (res.ok) setProjetos((atual) => atual.filter((p) => p.id !== projeto.id));
    else carregar();
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-marine-900">Projetos</h1>
          <p className="text-sm text-marine-500 mt-1">Agrupe demandas por área ou objetivo e acompanhe o progresso.</p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
          className="btn-primary self-start sm:self-auto"
        >
          + Novo projeto
        </button>
      </div>

      {projetos.length === 0 && (
        <p className="text-sm text-marine-400 text-center py-10">Nenhum projeto criado ainda.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projetos.map((p) => (
          <div key={p.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.cor }} />
                <span className="font-medium text-marine-900">{p.nome}</span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditando(p);
                    setModalAberto(true);
                  }}
                  className="text-xs text-marine-400 hover:text-marine-700"
                >
                  Editar
                </button>
                <button onClick={() => handleArquivar(p)} className="text-xs text-marine-400 hover:text-red-600">
                  Arquivar
                </button>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-marine-100 overflow-hidden mb-2">
              <div className="h-full" style={{ width: `${p.progresso}%`, backgroundColor: p.cor }} />
            </div>
            <p className="text-xs text-marine-500">
              {p.demandas_concluidas}/{p.total_demandas} concluídas · {p.progresso}%
            </p>
          </div>
        ))}
      </div>

      {modalAberto && (
        <ProjetoModal
          projeto={editando}
          onFechar={() => {
            setModalAberto(false);
            setEditando(null);
          }}
          onSalvo={handleSalvo}
        />
      )}
    </div>
  );
}
