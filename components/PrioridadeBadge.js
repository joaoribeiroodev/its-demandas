import clsx from "clsx";

const ESTILOS = {
  baixa: "bg-tide-50 text-tide-700 border-tide-200",
  media: "bg-amber-50 text-amber-700 border-amber-200",
  alta: "bg-red-50 text-red-700 border-red-200",
};

const LABELS = { baixa: "Baixa", media: "Média", alta: "Alta" };

export default function PrioridadeBadge({ prioridade, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        ESTILOS[prioridade],
        className
      )}
    >
      <span
        className={clsx("w-1.5 h-1.5 rounded-full", {
          "bg-tide-500": prioridade === "baixa",
          "bg-amber-500": prioridade === "media",
          "bg-red-500": prioridade === "alta",
        })}
      />
      {LABELS[prioridade]}
    </span>
  );
}
