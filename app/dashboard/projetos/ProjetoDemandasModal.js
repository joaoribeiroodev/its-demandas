"use client";

import { useMemo, useState } from "react";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import DemandaModal from "@/components/DemandaModal";
import { STATUS_COLUNAS } from "@/lib/demandaUtils";

const STATUS_LABEL = Object.fromEntries(STATUS_COLUNAS.map((s) => [s.valor, s.label]));

export default function ProjetoDemandasModal({ projeto, projetos, demandas, setDemandas, equipe, usuarioAtual, onFechar }) {
  const [selecao, setSelecao] = useState("");
  const [itemAberto, setItemAberto] = useState(null);

  const vinculadas = useMemo(
    () => demandas.filter((d) => d.projeto_id === projeto.id),
    [demandas, projeto.id]
  );

  const disponiveis = useMemo(
    () => demandas.filter((d) => d.projeto_id !== projeto.id && d.status !== "inbox"),
    [demandas, projeto.id]
  );

  async function atualizarProjetoDaDemanda(demandaId, novoProjetoId) {
    const res = await fetch(`/api/demandas/${demandaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projeto_id: novoProjetoId }),
    });
    const data = await res.json();
    if (res.ok) {
      setDemandas((atual) => atual.map((d) => (d.id === demandaId ? data.demanda : d)));
    } else {
      alert(data.erro || "Não foi possível atualizar a demanda.");
    }
  }

  function handleVincular(e) {
    const id = e.target.value;
    if (!id) return;
    atualizarProjetoDaDemanda(id, projeto.id);
    setSelecao("");
  }

  function handleDesvincular(demanda) {
    atualizarProjetoDaDemanda(demanda.id, null);
  }

  function handleSalvo(demandaSalva) {
    setDemandas((atual) => atual.map((d) => (d.id === demandaSalva.id ? demandaSalva : d)));
    setItemAberto(null);
  }

  function handleExcluido(id) {
    setDemandas((atual) => atual.filter((d) => d.id !== id));
    setItemAberto(null);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-marine-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-6 sm:py-10 overflow-y-auto">
        <div className="card w-full max-w-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-marine-900">Demandas · {projeto.nome}</h2>
            <button onClick={onFechar} className="text-marine-400 hover:text-marine-700 text-xl leading-none">
              &times;
            </button>
          </div>

          {disponiveis.length > 0 && (
            <select value={selecao} onChange={handleVincular} className="input text-sm mb-4">
              <option value="">+ Vincular uma demanda existente a este projeto...</option>
              {disponiveis.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.titulo}
                </option>
              ))}
            </select>
          )}

          {vinculadas.length === 0 ? (
            <p className="text-sm text-marine-400 text-center py-6">Nenhuma demanda vinculada ainda.</p>
          ) : (
            <ul className="space-y-1.5 max-h-96 overflow-y-auto">
              {vinculadas.map((d) => (
                <li key={d.id} className="flex items-center gap-2 bg-marine-50 rounded-lg px-3 py-2 group">
                  <button
                    onClick={() => setItemAberto(d)}
                    className="flex-1 min-w-0 text-left text-sm text-marine-800 hover:text-tide-700 truncate"
                  >
                    {d.titulo}
                  </button>
                  <span className="text-[11px] text-marine-400 shrink-0">{STATUS_LABEL[d.status]}</span>
                  <PrioridadeBadge prioridade={d.prioridade} className="shrink-0" />
                  <button
                    type="button"
                    onClick={() => handleDesvincular(d)}
                    className="text-marine-300 hover:text-red-500 text-xs shrink-0 opacity-0 group-hover:opacity-100"
                  >
                    desvincular
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {itemAberto && (
        <DemandaModal
          demanda={itemAberto}
          equipe={equipe}
          projetos={projetos}
          usuarioAtual={usuarioAtual}
          onFechar={() => setItemAberto(null)}
          onSalvo={handleSalvo}
          onExcluido={handleExcluido}
        />
      )}
    </>
  );
}
