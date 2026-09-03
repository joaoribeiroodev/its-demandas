"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import MetricCard from "@/components/MetricCard";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import {
  calcularMetricasDesempenho,
  evolucaoSemanal,
  distribuicaoPorPrioridade,
  formatarData,
} from "@/lib/demandaUtils";

// Carregado só quando necessário: recharts é uma dependência pesada e não
// deve fazer parte do JS inicial da página (cards e lista aparecem na hora,
// os gráficos "encaixam" alguns instantes depois).
const GraficosPainel = dynamic(() => import("@/components/GraficosPainel"), {
  ssr: false,
  loading: () => (
    <div className="grid lg:grid-cols-2 gap-4 mb-6">
      <div className="card p-4 h-[280px] animate-pulse bg-marine-50/60" />
      <div className="card p-4 h-[280px] animate-pulse bg-marine-50/60" />
    </div>
  ),
});

export default function PainelClient({ usuarioAtual, dadosIniciais }) {
  const demandas = dadosIniciais?.demandas || [];

  const minhas = useMemo(
    () =>
      demandas.filter(
        (d) => d.criado_por === usuarioAtual?.id || d.responsavel_id === usuarioAtual?.id
      ),
    [demandas, usuarioAtual]
  );

  const metricas = useMemo(() => calcularMetricasDesempenho(minhas), [minhas]);
  const evolucao = useMemo(() => evolucaoSemanal(minhas, 8), [minhas]);
  const distribuicao = useMemo(() => distribuicaoPorPrioridade(minhas), [minhas]);

  const ultimasConcluidas = useMemo(
    () =>
      minhas
        .filter((d) => d.status === "concluido")
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5),
    [minhas]
  );

  return (
    <div className="px-4 sm:px-6 py-6 max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-marine-900">Painel</h1>
      <p className="text-sm text-marine-500 mt-1 mb-6">
        Seu desempenho com base nas demandas que você cria e resolve.
      </p>

      {metricas.total === 0 ? (
        <div className="card p-8 text-center text-sm text-marine-400">
          Ainda não há demandas suas para gerar métricas. Crie ou assuma uma demanda para começar.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <MetricCard label="Demandas (criadas + minhas)" valor={metricas.total} />
            <MetricCard label="Concluídas" valor={metricas.totalConcluidas} tom="positivo" />
            <MetricCard label="Taxa de conclusão" valor={metricas.taxaConclusao} sufixo="%" tom="positivo" />
            <MetricCard
              label="Em atraso agora"
              valor={metricas.emAtraso}
              tom={metricas.emAtraso > 0 ? "critico" : "neutro"}
            />
          </div>

          <GraficosPainel evolucao={evolucao} distribuicao={distribuicao} />

          {metricas.tempoMedioDias !== null && (
            <div className="card p-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-marine-800">Tempo médio de conclusão</p>
                <p className="text-xs text-marine-400">Da criação até marcar como concluída</p>
              </div>
              <p className="font-display text-xl font-bold text-marine-900">
                {metricas.tempoMedioDias} <span className="text-sm font-medium text-marine-400">dias</span>
              </p>
            </div>
          )}

          <div className="card p-4">
            <h2 className="text-sm font-semibold text-marine-800 mb-3">Últimas concluídas</h2>
            {ultimasConcluidas.length === 0 ? (
              <p className="text-xs text-marine-400">Nenhuma demanda concluída ainda.</p>
            ) : (
              <div className="space-y-1.5">
                {ultimasConcluidas.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-3 px-1 py-1.5">
                    <span className="text-sm text-marine-700 truncate">{d.titulo}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <PrioridadeBadge prioridade={d.prioridade} />
                      <span className="text-[11px] text-marine-400 w-16 text-right">{formatarData(d.updated_at?.slice(0, 10))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
