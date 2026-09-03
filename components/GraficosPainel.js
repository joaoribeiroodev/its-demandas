"use client";

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

const CORES_PRIORIDADE = ["#4a8fca", "#d97706", "#dc2626"]; // baixa, média, alta (combina com PrioridadeBadge)

export default function GraficosPainel({ evolucao, distribuicao }) {
  return (
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
  );
}
