import clsx from "clsx";
import { NIVEIS_ENERGIA } from "@/lib/demandaUtils";

const ESTILOS = {
  leve: "bg-tide-50 text-tide-700 border-tide-200",
  moderada: "bg-amber-50 text-amber-700 border-amber-200",
  profunda: "bg-marine-100 text-marine-700 border-marine-200",
};

export default function EnergiaBadge({ energia, className }) {
  if (!energia) return null;
  const info = NIVEIS_ENERGIA.find((n) => n.valor === energia);
  if (!info) return null;

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        ESTILOS[energia],
        className
      )}
    >
      {info.label}
    </span>
  );
}
