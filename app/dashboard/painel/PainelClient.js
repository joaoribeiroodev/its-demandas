"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import MetricCard from "@/components/MetricCard";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import {
  calcularMetricasDesempenho,
  evolucaoSemanal,
  distribuicaoPorPrioridade,
  formatarData,
} from "@/lib/demandaUtils";

const CORES_PRIORIDADE = ["#4a8fca", "#d97706", "#dc2626"]; // baixa, média, alta (combina com PrioridadeBadge)

export default function PainelClient({ usuarioAtual }) {
  const [demandas, setDemandas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    fetch("/api/demandas")
      .then((r) => r.json())
      .then((data) => setDemandas(data.demandas || []))
      .finally(() => setCarregando(false));
  }, []);

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

  if (carregando) {
    return (
      <div className="px-4 sm:px-6 py-6">
        <p className="text-sm text-marine-400">Carregando painel...</p>
      </div>
    );
  }

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

          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            <div className="card p-4">
              <h2 className="text-sm font-semibold text-marine-800 mb-1">Evolução — concluídas por semana</h2>
              <p className="text-xs text-marine-400 mb-4">Últimas 8 semanas</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={evolucao} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="semana" tick={{ fontSize: 11, fill: "#66859e" }} axisLine={{ stroke: "#d6e8f6" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#66859e" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#d6e8f6" }} />
                  <Line type="monotone" dataKey="concluidas" stroke="#4a7a26" strokeWidth={2.5} dot={{ r: 3, fill: "#4a7a26" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-4">
              <h2 className="text-sm font-semibold text-marine-800 mb-1">Concluídas por prioridade</h2>
              <p className="text-xs text-marine-400 mb-4">Todo o histórico</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={distribuicao} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef1f4" />
                  <XAxis dataKey="prioridade" tick={{ fontSize: 11, fill: "#66859e" }} axisLine={{ stroke: "#d6e8f6" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#66859e" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "#d6e8f6" }} />
                  <Bar dataKey="quantidade" radius={[4, 4, 0, 0]}>
                    {distribuicao.map((_, i) => (
                      <Cell key={i} fill={CORES_PRIORIDADE[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
