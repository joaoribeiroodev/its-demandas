"use client";

import { useEffect, useMemo, useState } from "react";
import CapturaRapida from "@/components/CapturaRapida";
import DemandaModal from "@/components/DemandaModal";
import PrioridadeBadge from "@/components/PrioridadeBadge";
import EnergiaBadge from "@/components/EnergiaBadge";
import SnoozeMenu from "@/components/SnoozeMenu";
import { hojeISO, formatarDuracao } from "@/lib/demandaUtils";

export default function MeuDiaClient({ usuarioAtual }) {
  const [demandas, setDemandas] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [itemAberto, setItemAberto] = useState(null);
  const [selecaoRapida, setSelecaoRapida] = useState("");

  const hoje = hojeISO();

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    setCarregando(true);
    const [resDemandas, resEquipe, resProjetos] = await Promise.all([
      fetch("/api/demandas"),
      fetch("/api/equipe"),
      fetch("/api/projetos"),
    ]);
    setDemandas((await resDemandas.json()).demandas || []);
    setEquipe((await resEquipe.json()).equipe || []);
    setProjetos((await resProjetos.json()).projetos || []);
    setCarregando(false);
  }

  const doDia = useMemo(() => demandas.filter((d) => d.foco_dia_data === hoje), [demandas, hoje]);
  const pendentes = doDia.filter((d) => d.status !== "concluido");
  const concluidasHoje = doDia.filter((d) => d.status === "concluido");

  const disponiveisParaHoje = useMemo(
    () =>
      demandas.filter(
        (d) => d.status !== "inbox" && d.status !== "concluido" && d.foco_dia_data !== hoje
      ),
    [demandas, hoje]
  );

  async function handleCriar(payload) {
    const res = await fetch("/api/demandas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, foco_dia_data: payload.foco_dia_data || hoje, status: "backlog" }),
    });
    const data = await res.json();
    if (res.ok) setDemandas((atual) => [data.demanda, ...atual]);
  }

  async function atualizarDemanda(id, campos) {
    setDemandas((atual) => atual.map((d) => (d.id === id ? { ...d, ...campos } : d)));
    const res = await fetch(`/api/demandas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(campos),
    });
    const data = await res.json();
    if (res.ok) {
      setDemandas((atual) => {
        const atualizado = atual.map((d) => (d.id === id ? data.demanda : d));
        return data.proximaOcorrencia ? [data.proximaOcorrencia, ...atualizado] : atualizado;
      });
    }
  }

  function handleAdicionarExistente(e) {
    const id = e.target.value;
    if (!id) return;
    atualizarDemanda(id, { foco_dia_data: hoje });
    setSelecaoRapida("");
  }

  function handleSalvo(demandaSalva, proximaOcorrencia) {
    setDemandas((atual) => {
      const existe = atual.some((d) => d.id === demandaSalva.id);
      let atualizado = existe ? atual.map((d) => (d.id === demandaSalva.id ? demandaSalva : d)) : [demandaSalva, ...atual];
      if (proximaOcorrencia) atualizado = [proximaOcorrencia, ...atualizado];
      return atualizado;
    });
    setItemAberto(null);
  }

  function handleExcluido(id) {
    setDemandas((atual) => atual.filter((d) => d.id !== id));
    setItemAberto(null);
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-marine-900">Meu Dia</h1>
      <p className="text-sm text-marine-500 mt-1 mb-5">
        Só o que importa executar hoje — o resto do backlog fica fora de vista.
      </p>

      <CapturaRapida onCriar={handleCriar} />

      {disponiveisParaHoje.length > 0 && (
        <select value={selecaoRapida} onChange={handleAdicionarExistente} className="input mt-3 text-sm">
          <option value="">+ Trazer uma tarefa existente para hoje...</option>
          {disponiveisParaHoje.map((d) => (
            <option key={d.id} value={d.id}>
              {d.titulo}
            </option>
          ))}
        </select>
      )}

      <div className="mt-6 space-y-2">
        {carregando && <p className="text-sm text-marine-400">Carregando...</p>}
        {!carregando && pendentes.length === 0 && (
          <p className="text-sm text-marine-400 text-center py-8">
            Nada planejado para hoje ainda. Capture algo acima ou traga uma tarefa do backlog.
          </p>
        )}
        {pendentes.map((d) => (
          <div key={d.id} className="card p-3.5 flex items-start gap-3">
            <input
              type="checkbox"
              checked={false}
              onChange={() => atualizarDemanda(d.id, { status: "concluido" })}
              className="w-4 h-4 mt-0.5 rounded border-marine-300 text-tide-600 focus:ring-tide-500"
            />
            <button onClick={() => setItemAberto(d)} className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-marine-900 truncate">{d.titulo}</p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <PrioridadeBadge prioridade={d.prioridade} />
                <EnergiaBadge energia={d.energia} />
                {d.duracao_estimada_min && (
                  <span className="text-[11px] text-marine-400">{formatarDuracao(d.duracao_estimada_min)}</span>
                )}
              </div>
            </button>
            <SnoozeMenu onAdiar={(dataAlvo) => atualizarDemanda(d.id, { foco_dia_data: dataAlvo })} />
          </div>
        ))}
      </div>

      {concluidasHoje.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold text-marine-400 uppercase tracking-wide mb-2">
            Concluídas hoje ({concluidasHoje.length})
          </h2>
          <div className="space-y-1.5">
            {concluidasHoje.map((d) => (
              <div key={d.id} className="text-sm text-marine-400 line-through px-1">
                {d.titulo}
              </div>
            ))}
          </div>
        </div>
      )}

      {itemAberto && (
        <DemandaModal
          demanda={itemAberto}
          equipe={equipe}
          projetos={projetos}
          podeExcluir={["admin", "gestor"].includes(usuarioAtual.permissao)}
          onFechar={() => setItemAberto(null)}
          onSalvo={handleSalvo}
          onExcluido={handleExcluido}
        />
      )}
    </div>
  );
}
