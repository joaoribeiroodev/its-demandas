export default function MetricCard({ label, valor, sufixo, tom = "neutro" }) {
  const cores = {
    neutro: "text-marine-900",
    positivo: "text-tide-600",
    alerta: "text-amber-600",
    critico: "text-red-600",
  };

  return (
    <div className="card p-4">
      <p className="text-xs font-medium text-marine-500 mb-1.5">{label}</p>
      <p className={`font-display text-2xl font-bold ${cores[tom]}`}>
        {valor}
        {sufixo && <span className="text-sm font-medium text-marine-400 ml-1">{sufixo}</span>}
      </p>
    </div>
  );
}
