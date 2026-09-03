"use client";

import { useState } from "react";
import CapturaRapida from "@/components/CapturaRapida";
import DemandaModal from "@/components/DemandaModal";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import { formatarData } from "@/lib/demandaUtils";

export default function InboxClient({ usuarioAtual, dadosIniciais }) {
  const [itens, setItens] = useState(dadosIniciais?.itens || []);
  const [equipe, setEquipe] = useState(dadosIniciais?.equipe || []);
  const [projetos, setProjetos] = useState(dadosIniciais?.projetos || []);
  const [itemAberto, setItemAberto] = useState(null);

  async function carregar() {
    const [resDemandas, resEquipe, resProjetos] = await Promise.all([
      fetch("/api/demandas"),
      fetch("/api/equipe"),
      fetch("/api/projetos"),
    ]);
    const dataDemandas = await resDemandas.json();
    setItens((dataDemandas.demandas || []).filter((d) => d.status === "inbox"));
    setEquipe((await resEquipe.json()).equipe || []);
    setProjetos((await resProjetos.json()).projetos || []);
  }

  async function handleCriar(payload) {
    const res = await fetch("/api/demandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok && data.demanda.status === "inbox") {
      setItens((atual) => [data.demanda, ...atual]);
    } else if (res.ok) {
      // Veio com prioridade/data já definidos pelos atalhos e passou direto para o Meu Dia/Backlog.
      carregar();
    }
  }

  function handleProcessado(demandaSalva) {
    // Se ainda continuar como inbox (não deveria, mas por segurança), mantém na lista.
    setItens((atual) =>
      demandaSalva.status === "inbox"
        ? atual.map((d) => (d.id === demandaSalva.id ? demandaSalva : d))
        : atual.filter((d) => d.id !== demandaSalva.id)
    );
    setItemAberto(null);
  }

  function handleExcluido(id) {
    setItens((atual) => atual.filter((d) => d.id !== id));
    setItemAberto(null);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-marine-900">Inbox</h1>
      <p className="text-sm text-marine-500 mt-1 mb-5">
        Jogue tudo aqui sem se preocupar em organizar agora. Processe depois, com calma.
      </p>

      <CapturaRapida onCriar={handleCriar} />

      <div className="mt-6 space-y-2">
        {itens.length === 0 && (
          <p className="text-sm text-marine-400 text-center py-10">
            Inbox vazio. Tudo processado — bom trabalho.
          </p>
        )}
        {itens.map((item) => (
          <button
            key={item.id}
            onClick={() => setItemAberto(item)}
            className="w-full card p-3.5 flex items-center justify-between gap-3 text-left hover:border-tide-300"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-marine-900 truncate">{item.titulo}</p>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {item.tags?.map((tag) => (
                  <span key={tag} className="text-[11px] text-marine-400">
                    #{tag}
                  </span>
                ))}
                {item.foco_dia_data && (
                  <span className="text-[11px] text-tide-600">para {formatarData(item.foco_dia_data)}</span>
                )}
              </div>
            </div>
            <PrioridadeBadge prioridade={item.prioridade} className="shrink-0" />
          </button>
        ))}
      </div>

      {itemAberto && (
        <DemandaModal
          demanda={itemAberto}
          equipe={equipe}
          projetos={projetos}
          usuarioAtual={usuarioAtual}
          onFechar={() => setItemAberto(null)}
          onSalvo={handleProcessado}
          onExcluido={handleExcluido}
        />
      )}
    </div>
  );
}
