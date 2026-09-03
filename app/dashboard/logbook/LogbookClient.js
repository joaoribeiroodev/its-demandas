"use client";

import { useMemo, useState } from "react";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import EnergiaBadge from "@/components/EnergiaBadge";
import ModoVisualizacaoToggle from "@/components/ModoVisualizacaoToggle";
import DemandaModal from "@/components/DemandaModal";
import { formatarDuracao, diasEntreDatas } from "@/lib/demandaUtils";

function chaveMes(dataISO) {
  const data = new Date(dataISO);
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function labelMes(chave) {
  const [ano, mes] = chave.split("-").map(Number);
  const data = new Date(ano, mes - 1, 1);
  const texto = data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export default function LogbookClient({ usuarioAtual, dadosIniciais }) {
  const [todasConcluidas, setTodasConcluidas] = useState(dadosIniciais?.concluidas || []);
  const equipe = dadosIniciais?.equipe || [];
  const projetos = dadosIniciais?.projetos || [];
  const [modoVisualizacao, setModoVisualizacao] = useState("equipe");
  const [itemAberto, setItemAberto] = useState(null);
  const ehGestor = usuarioAtual?.permissao === "gestor";

  const demandas = useMemo(() => {
    if (!ehGestor || modoVisualizacao !== "minhas") return todasConcluidas;
    return todasConcluidas.filter(
      (d) => d.criado_por === usuarioAtual.id || d.responsavel_id === usuarioAtual.id
    );
  }, [todasConcluidas, ehGestor, modoVisualizacao, usuarioAtual]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    const ordenadas = [...demandas].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    for (const d of ordenadas) {
      const chave = chaveMes(d.updated_at);
      if (!mapa.has(chave)) mapa.set(chave, []);
      mapa.get(chave).push(d);
    }
    return Array.from(mapa.entries());
  }, [demandas]);

  const concluidasUltimos7Dias = useMemo(() => {
    const limite = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return demandas.filter((d) => new Date(d.updated_at).getTime() >= limite).length;
  }, [demandas]);

  function handleSalvo(demandaSalva) {
    setTodasConcluidas((atual) => {
      // Se deixou de estar concluída (reaberta), sai da lista do Logbook.
      if (demandaSalva.status !== "concluido") {
        return atual.filter((d) => d.id !== demandaSalva.id);
      }
      const existe = atual.some((d) => d.id === demandaSalva.id);
      return existe ? atual.map((d) => (d.id === demandaSalva.id ? demandaSalva : d)) : [demandaSalva, ...atual];
    });
    setItemAberto(null);
  }

  function handleExcluido(id) {
    setTodasConcluidas((atual) => atual.filter((d) => d.id !== id));
    setItemAberto(null);
  }

  async function handleReabrirRapido(e, demanda) {
    e.stopPropagation();
    const res = await fetch(`/api/demandas/${demanda.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ encerrada: false }),
    });
    if (res.ok) {
      const data = await res.json();
      setTodasConcluidas((atual) => atual.map((d) => (d.id === demanda.id ? data.demanda : d)));
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-marine-900">Logbook</h1>
          <p className="text-sm text-marine-500 mt-1">Histórico do que já foi concluído. Clique num item para ver todos os detalhes.</p>
        </div>
        {ehGestor && (
          <ModoVisualizacaoToggle
            modo={modoVisualizacao}
            onMudar={setModoVisualizacao}
            labelEquipe={`Setor · ${usuarioAtual.setor}`}
          />
        )}
      </div>
      <p className="text-xs text-marine-400 mb-6">
        {concluidasUltimos7Dias} concluída(s) nos últimos 7 dias · {demandas.length} no total
      </p>

      {grupos.length === 0 && (
        <p className="text-sm text-marine-400 text-center py-10">Nada concluído ainda.</p>
      )}

      <div className="space-y-6">
        {grupos.map(([chave, itens]) => (
          <div key={chave}>
            <h2 className="text-xs font-semibold text-marine-400 uppercase tracking-wide mb-2">
              {labelMes(chave)} · {itens.length}
            </h2>
            <div className="space-y-1.5">
              {itens.map((d) => {
                const totalSubtarefas = d.subtarefas?.length || 0;
                const subtarefasConcluidas = d.subtarefas?.filter((s) => s.concluida).length || 0;
                const diasParaConcluir = diasEntreDatas(d.created_at, d.updated_at);

                return (
                  <div
                    key={d.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setItemAberto(d)}
                    onKeyDown={(e) => e.key === "Enter" && setItemAberto(d)}
                    className="w-full text-left card px-3.5 py-3 hover:border-tide-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-marine-800 truncate">
                        {d.recorrente && <span title="Recorrente">🔁 </span>}
                        {d.equipe && <span title="Demanda de equipe">👥 </span>}
                        {d.titulo}
                      </p>
                      <PrioridadeBadge prioridade={d.prioridade} className="shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {d.encerrada && (
                        <span className="inline-flex items-center rounded-md bg-marine-800 text-white text-[11px] font-medium px-2 py-0.5">
                          ✓ Encerrada
                        </span>
                      )}
                      {d.setor && (
                        <span className="inline-flex items-center rounded-md bg-marine-50 text-marine-600 text-[11px] font-medium px-2 py-0.5">
                          {d.setor}
                        </span>
                      )}
                      {d.projeto && (
                        <span
                          className="inline-flex items-center rounded-md text-[11px] font-medium px-2 py-0.5"
                          style={{ backgroundColor: `${d.projeto.cor}1a`, color: d.projeto.cor }}
                        >
                          {d.projeto.nome}
                        </span>
                      )}
                      <EnergiaBadge energia={d.energia} />
                      {d.tags?.map((tag) => (
                        <span key={tag} className="text-[11px] text-marine-400">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-marine-400">
                      <span>{d.responsavel?.nome || d.criador?.nome || "Sem responsável"}</span>
                      {d.duracao_estimada_min && <span>~{formatarDuracao(d.duracao_estimada_min)}</span>}
                      {diasParaConcluir !== null && (
                        <span>
                          Levou {diasParaConcluir === 0 ? "menos de 1 dia" : `${diasParaConcluir} dia(s)`}
                        </span>
                      )}
                      {totalSubtarefas > 0 && (
                        <span>
                          {subtarefasConcluidas}/{totalSubtarefas} subtarefas
                        </span>
                      )}
                      <span className="ml-auto">Concluída em {new Date(d.updated_at).toLocaleDateString("pt-BR")}</span>
                    </div>

                    {d.encerrada && (
                      <div className="mt-2 pt-2 border-t border-marine-50 flex justify-end">
                        <button
                          type="button"
                          onClick={(e) => handleReabrirRapido(e, d)}
                          className="text-xs font-medium text-tide-700 hover:text-tide-800"
                        >
                          Reabrir
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
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
    </div>
  );
}
