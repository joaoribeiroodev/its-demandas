import { Draggable } from "@hello-pangea/dnd";
import clsx from "clsx";
import PrioridadeBadge from "./PrioridadeBadge";
import { prazoStatusLabel } from "@/lib/demandaUtils";

const TOM_ESTILO = {
  critico: "text-red-600",
  alerta: "text-amber-600",
  ok: "text-marine-500",
  neutro: "text-marine-400",
};

export default function DemandaCard({ demanda, index, onClick }) {
  const prazo = prazoStatusLabel(demanda.prazo_data, demanda.status);

  return (
    <Draggable draggableId={demanda.id} index={index}>
      {(provided, snapshot) => (
        <button
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(demanda)}
          className={clsx(
            "w-full text-left card p-3.5 flex flex-col gap-2.5 hover:border-tide-300 transition-colors",
            snapshot.isDragging && "shadow-lg ring-2 ring-tide-400"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm text-marine-900 leading-snug line-clamp-2">
              {demanda.titulo}
            </p>
            <PrioridadeBadge prioridade={demanda.prioridade} className="shrink-0" />
          </div>

          <span className="inline-flex w-fit items-center rounded-md bg-marine-50 text-marine-600 text-[11px] font-medium px-2 py-0.5">
            {demanda.setor}
          </span>

          <div className="flex items-center justify-between pt-1 border-t border-marine-50">
            <span className="text-[11px] text-marine-500 truncate">
              {demanda.responsavel?.nome || "Sem responsável"}
            </span>
            <span className={clsx("text-[11px] font-medium", TOM_ESTILO[prazo.tom])}>
              {prazo.texto}
            </span>
          </div>
        </button>
      )}
    </Draggable>
  );
}
