import { Draggable } from "@hello-pangea/dnd";
import clsx from "clsx";
import PrioridadeBadge from "./PrioridadeBadge";
import EnergiaBadge from "./EnergiaBadge";
import { prazoStatusLabel, formatarDuracao } from "@/lib/demandaUtils";

const TOM_ESTILO = {
  critico: "text-red-600",
  alerta: "text-amber-600",
  ok: "text-marine-500",
  neutro: "text-marine-400",
};

export default function DemandaCard({ demanda, index, onClick }) {
  const prazo = prazoStatusLabel(demanda.prazo_data, demanda.status);
  const totalSubtarefas = demanda.subtarefas?.length || 0;
  const subtarefasConcluidas = demanda.subtarefas?.filter((s) => s.concluida).length || 0;

  function handleKeyDown(e) {
    // Enter ativa o clique (abre o modal). Espaço fica livre para o "lift"
    // de teclado da própria biblioteca de drag-and-drop.
    if (e.key === "Enter") onClick(demanda);
  }

  return (
    <Draggable draggableId={demanda.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(demanda)}
          onKeyDown={handleKeyDown}
          className={clsx(
            "w-full text-left card p-3.5 flex flex-col gap-2.5 cursor-pointer hover:border-tide-300 transition-colors",
            snapshot.isDragging && "shadow-lg ring-2 ring-tide-400"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium text-sm text-marine-900 leading-snug line-clamp-2">
              {demanda.recorrente && <span title="Recorrente">🔁 </span>}
              {demanda.titulo}
            </p>
            <PrioridadeBadge prioridade={demanda.prioridade} className="shrink-0" />
          </div>

          {(demanda.setor || demanda.projeto || demanda.energia) && (
            <div className="flex flex-wrap gap-1">
              {demanda.setor && (
                <span
                  className={clsx(
                    "inline-flex items-center gap-1 rounded-md text-[11px] font-medium px-2 py-0.5",
                    demanda.equipe ? "bg-marine-800 text-white" : "bg-marine-50 text-marine-600"
                  )}
                >
                  {demanda.equipe && "👥"} {demanda.setor}
                </span>
              )}
              {demanda.projeto && (
                <span
                  className="inline-flex items-center rounded-md text-[11px] font-medium px-2 py-0.5"
                  style={{ backgroundColor: `${demanda.projeto.cor}1a`, color: demanda.projeto.cor }}
                >
                  {demanda.projeto.nome}
                </span>
              )}
              <EnergiaBadge energia={demanda.energia} />
            </div>
          )}

          {demanda.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {demanda.tags.map((tag) => (
                <span key={tag} className="text-[11px] text-marine-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {totalSubtarefas > 0 && (
            <div className="flex items-center gap-1.5">
              <div className="h-1 flex-1 rounded-full bg-marine-100 overflow-hidden">
                <div
                  className="h-full bg-tide-500"
                  style={{ width: `${Math.round((subtarefasConcluidas / totalSubtarefas) * 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-marine-400 shrink-0">
                {subtarefasConcluidas}/{totalSubtarefas}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-marine-50">
            <span className="text-[11px] text-marine-500 truncate flex items-center gap-1.5">
              {demanda.responsavel?.nome || "Sem responsável"}
              {demanda.duracao_estimada_min && (
                <span className="text-marine-300">· {formatarDuracao(demanda.duracao_estimada_min)}</span>
              )}
            </span>
            <span className={clsx("text-[11px] font-medium shrink-0", TOM_ESTILO[prazo.tom])}>
              {prazo.texto}
            </span>
          </div>
        </div>
      )}
    </Draggable>
  );
}
