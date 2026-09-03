"use client";

import { useMemo, useState } from "react";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import ModoVisualizacaoToggle from "@/components/ModoVisualizacaoToggle";

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
  const todasConcluidas = dadosIniciais?.concluidas || [];
  const [modoVisualizacao, setModoVisualizacao] = useState("equipe");
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

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
        <div>
          <h1 className="font-display text-2xl font-bold text-marine-900">Logbook</h1>
          <p className="text-sm text-marine-500 mt-1">Histórico do que já foi concluído.</p>
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
              {itens.map((d) => (
                <div key={d.id} className="card px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-marine-800 truncate">{d.titulo}</p>
                    <p className="text-[11px] text-marine-400">
                      {d.setor || "Sem setor"}
                      {d.projeto ? ` · ${d.projeto.nome}` : ""} ·{" "}
                      {new Date(d.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <PrioridadeBadge prioridade={d.prioridade} className="shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
