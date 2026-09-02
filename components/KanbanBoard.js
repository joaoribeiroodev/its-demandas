"use client";

import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import clsx from "clsx";
import DemandaCard from "./DemandaCard";
import { STATUS_COLUNAS } from "@/lib/demandaUtils";

const COR_COLUNA = {
  backlog: "bg-marine-200",
  todo: "bg-marine-400",
  em_andamento: "bg-amber-400",
  revisao: "bg-tide-400",
  concluido: "bg-tide-600",
};

export default function KanbanBoard({ demandas, onMudarStatus, onAbrirDemanda }) {
  function handleDragEnd(result) {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    onMudarStatus(draggableId, destination.droppableId);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto px-4 sm:px-6 pb-6 h-full">
        {STATUS_COLUNAS.map((coluna) => {
          const itens = demandas.filter((d) => d.status === coluna.valor);
          return (
            <div key={coluna.valor} className="flex flex-col w-72 shrink-0">
              <div className="flex items-center gap-2 px-1 py-3">
                <span className={clsx("w-2 h-2 rounded-full", COR_COLUNA[coluna.valor])} />
                <h3 className="text-sm font-semibold text-marine-800">{coluna.label}</h3>
                <span className="text-xs text-marine-400 font-medium">{itens.length}</span>
              </div>

              <Droppable droppableId={coluna.valor}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={clsx(
                      "flex-1 flex flex-col gap-2.5 rounded-xl p-2 min-h-[200px] transition-colors",
                      snapshot.isDraggingOver ? "bg-tide-50" : "bg-marine-50/60"
                    )}
                  >
                    {itens.map((demanda, index) => (
                      <DemandaCard
                        key={demanda.id}
                        demanda={demanda}
                        index={index}
                        onClick={onAbrirDemanda}
                      />
                    ))}
                    {provided.placeholder}
                    {itens.length === 0 && (
                      <p className="text-xs text-marine-300 text-center py-6">Nenhuma demanda aqui.</p>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
