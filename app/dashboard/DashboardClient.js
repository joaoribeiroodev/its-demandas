"use client";

import { useEffect, useMemo, useState } from "react";
import KanbanBoard from "@/components/KanbanBoard";
import FiltrosBar from "@/components/FiltrosBar";
import DemandaModal from "@/components/DemandaModal";
import { SETORES_SUGERIDOS } from "@/lib/demandaUtils";

export default function DashboardClient({ usuarioAtual }) {
  const [demandas, setDemandas] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [demandaAberta, setDemandaAberta] = useState(null);
  const [criandoNova, setCriandoNova] = useState(false);
  const [filtros, setFiltros] = useState({ busca: "", setor: "", prioridade: "", responsavel: "" });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    const [resDemandas, resEquipe] = await Promise.all([
      fetch("/api/demandas"),
      fetch("/api/equipe"),
    ]);
    const dataDemandas = await resDemandas.json();
    const dataEquipe = await resEquipe.json();
    setDemandas(dataDemandas.demandas || []);
    setEquipe(dataEquipe.equipe || []);
    setCarregando(false);
  }

  const setoresDisponiveis = useMemo(() => {
    const setores = new Set([...SETORES_SUGERIDOS, ...demandas.map((d) => d.setor)]);
    return Array.from(setores).sort();
  }, [demandas]);

  const demandasFiltradas = useMemo(() => {
    return demandas.filter((d) => {
      if (filtros.busca && !d.titulo.toLowerCase().includes(filtros.busca.toLowerCase())) return false;
      if (filtros.setor && d.setor !== filtros.setor) return false;
      if (filtros.prioridade && d.prioridade !== filtros.prioridade) return false;
      if (filtros.responsavel && d.responsavel_id !== filtros.responsavel) return false;
      return true;
    });
  }, [demandas, filtros]);

  async function handleMudarStatus(id, novoStatus) {
    setDemandas((atual) => atual.map((d) => (d.id === id ? { ...d, status: novoStatus } : d)));
    const res = await fetch(`/api/demandas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: novoStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setDemandas((atual) => atual.map((d) => (d.id === id ? data.demanda : d)));
    } else {
      carregarDados();
    }
  }

  function handleSalvo(demandaSalva) {
    setDemandas((atual) => {
      const existe = atual.some((d) => d.id === demandaSalva.id);
      return existe ? atual.map((d) => (d.id === demandaSalva.id ? demandaSalva : d)) : [demandaSalva, ...atual];
    });
    setDemandaAberta(null);
    setCriandoNova(false);
  }

  function handleExcluido(id) {
    setDemandas((atual) => atual.filter((d) => d.id !== id));
    setDemandaAberta(null);
  }

  const podeExcluir = ["admin", "gestor"].includes(usuarioAtual.permissao);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 pt-6">
        <h1 className="font-display text-2xl font-bold text-marine-900">Quadro de Demandas</h1>
        <p className="text-sm text-marine-500 mt-1">
          Acompanhe prioridades, prazos e responsáveis em cada etapa do fluxo.
        </p>
      </div>

      <FiltrosBar
        filtros={filtros}
        setFiltros={setFiltros}
        setores={setoresDisponiveis}
        equipe={equipe}
        onNovaDemanda={() => setCriandoNova(true)}
      />

      {carregando ? (
        <div className="flex-1 flex items-center justify-center text-marine-400 text-sm">
          Carregando demandas...
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <KanbanBoard
            demandas={demandasFiltradas}
            onMudarStatus={handleMudarStatus}
            onAbrirDemanda={setDemandaAberta}
          />
        </div>
      )}

      {(demandaAberta || criandoNova) && (
        <DemandaModal
          demanda={demandaAberta}
          equipe={equipe}
          podeExcluir={podeExcluir}
          onFechar={() => {
            setDemandaAberta(null);
            setCriandoNova(false);
          }}
          onSalvo={handleSalvo}
          onExcluido={handleExcluido}
        />
      )}
    </div>
  );
}
