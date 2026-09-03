"use client";

import { useMemo, useState } from "react";
import ProjetoModal from "./ProjetoModal";
import ProjetoDemandasModal from "./ProjetoDemandasModal";
import AnexosList from "@/components/AnexosList";

export default function ProjetosClient({ usuarioAtual, dadosIniciais }) {
  const [projetos, setProjetos] = useState(dadosIniciais?.projetos || []);
  const [demandas, setDemandas] = useState(dadosIniciais?.demandas || []);
  const equipe = dadosIniciais?.equipe || [];
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [anexosDoProjeto, setAnexosDoProjeto] = useState(null);
  const [demandasDoProjeto, setDemandasDoProjeto] = useState(null);

  // Progresso calculado ao vivo a partir das demandas em memória, para
  // refletir na hora qualquer vínculo/desvínculo feito pelo modal de
  // "Demandas do projeto", sem precisar recarregar a página.
  const progressoPorProjeto = useMemo(() => {
    const mapa = new Map();
    for (const p of projetos) {
      const itens = demandas.filter((d) => d.projeto_id === p.id);
      const concluidas = itens.filter((d) => d.status === "concluido").length;
      mapa.set(p.id, {
        total: itens.length,
        concluidas,
        progresso: itens.length ? Math.round((concluidas / itens.length) * 100) : 0,
      });
    }
    return mapa;
  }, [projetos, demandas]);

  async function carregar() {
    const res = await fetch("/api/projetos");
    const data = await res.json();
    setProjetos(data.projetos || []);
  }

  function handleSalvo(projetoSalvo) {
    setProjetos((atual) => {
      const existe = atual.some((p) => p.id === projetoSalvo.id);
      return existe
        ? atual.map((p) => (p.id === projetoSalvo.id ? { ...p, ...projetoSalvo } : p))
        : [{ ...projetoSalvo, total_demandas: 0, demandas_concluidas: 0, progresso: 0 }, ...atual];
    });
    setModalAberto(false);
    setEditando(null);
  }

  async function handleArquivar(projeto) {
    if (!confirm(`Arquivar o projeto "${projeto.nome}"? As demandas vinculadas continuam existindo.`)) return;
    const res = await fetch(`/api/projetos/${projeto.id}`, { method: "DELETE" });
    if (res.ok) setProjetos((atual) => atual.filter((p) => p.id !== projeto.id));
    else carregar();
  }

  async function handleExcluirDefinitivo(projeto) {
    const confirmado = confirm(
      `Excluir definitivamente o projeto "${projeto.nome}"?\n\n` +
        `Essa ação não pode ser desfeita. Os anexos enviados diretamente para este projeto serão apagados. ` +
        `As demandas vinculadas a ele NÃO são excluídas — só perdem a referência ao projeto.`
    );
    if (!confirmado) return;
    const res = await fetch(`/api/projetos/${projeto.id}?definitivo=true`, { method: "DELETE" });
    if (res.ok) {
      setProjetos((atual) => atual.filter((p) => p.id !== projeto.id));
    } else {
      const data = await res.json();
      alert(data.erro || "Não foi possível excluir o projeto.");
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-marine-900">Projetos</h1>
          <p className="text-sm text-marine-500 mt-1">Agrupe demandas por área ou objetivo e acompanhe o progresso.</p>
        </div>
        <button
          onClick={() => {
            setEditando(null);
            setModalAberto(true);
          }}
          className="btn-primary self-start sm:self-auto"
        >
          + Novo projeto
        </button>
      </div>

      {projetos.length === 0 && (
        <p className="text-sm text-marine-400 text-center py-10">Nenhum projeto criado ainda.</p>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projetos.map((p) => {
          const stats = progressoPorProjeto.get(p.id) || { total: 0, concluidas: 0, progresso: 0 };
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.cor }} />
                  <span className="font-medium text-marine-900">{p.nome}</span>
                </div>
              </div>

              <div className="h-1.5 w-full rounded-full bg-marine-100 overflow-hidden mb-2">
                <div className="h-full" style={{ width: `${stats.progresso}%`, backgroundColor: p.cor }} />
              </div>
              <p className="text-xs text-marine-500 mb-3">
                {stats.concluidas}/{stats.total} concluídas · {stats.progresso}%
              </p>

              <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-marine-50">
                <button
                  onClick={() => setDemandasDoProjeto(p)}
                  className="text-xs text-marine-400 hover:text-marine-700"
                >
                  Demandas
                </button>
                <button
                  onClick={() => setAnexosDoProjeto(p)}
                  className="text-xs text-marine-400 hover:text-marine-700"
                >
                  Anexos
                </button>
                <button
                  onClick={() => {
                    setEditando(p);
                    setModalAberto(true);
                  }}
                  className="text-xs text-marine-400 hover:text-marine-700"
                >
                  Editar
                </button>
                <button onClick={() => handleArquivar(p)} className="text-xs text-marine-400 hover:text-marine-700">
                  Arquivar
                </button>
                {["admin", "gestor"].includes(usuarioAtual?.permissao) && (
                  <button
                    onClick={() => handleExcluirDefinitivo(p)}
                    className="text-xs text-marine-400 hover:text-red-600"
                  >
                    Excluir
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalAberto && (
        <ProjetoModal
          projeto={editando}
          onFechar={() => {
            setModalAberto(false);
            setEditando(null);
          }}
          onSalvo={handleSalvo}
        />
      )}

      {anexosDoProjeto && (
        <div className="fixed inset-0 z-50 bg-marine-900/40 backdrop-blur-sm flex items-start justify-center p-4 py-6 sm:py-10 overflow-y-auto">
          <div className="card w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-marine-900">
                Anexos · {anexosDoProjeto.nome}
              </h2>
              <button
                onClick={() => setAnexosDoProjeto(null)}
                className="text-marine-400 hover:text-marine-700 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <AnexosList projetoId={anexosDoProjeto.id} usuarioAtual={usuarioAtual} />
          </div>
        </div>
      )}

      {demandasDoProjeto && (
        <ProjetoDemandasModal
          projeto={demandasDoProjeto}
          projetos={projetos}
          demandas={demandas}
          setDemandas={setDemandas}
          equipe={equipe}
          usuarioAtual={usuarioAtual}
          onFechar={() => setDemandasDoProjeto(null)}
        />
      )}
    </div>
  );
}
