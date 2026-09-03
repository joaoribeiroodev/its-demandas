"use client";

import { useMemo, useState } from "react";
import { formatarTamanhoArquivo, iconeArquivo, formatarData } from "@/lib/demandaUtils";

export default function ArquivosClient({ usuarioAtual, dadosIniciais }) {
  const [arquivos, setArquivos] = useState(dadosIniciais?.arquivos || []);
  const [busca, setBusca] = useState("");
  const [origem, setOrigem] = useState(""); // "" | "demanda" | "projeto"

  const arquivosFiltrados = useMemo(() => {
    return arquivos.filter((a) => {
      if (busca && !a.nome_original.toLowerCase().includes(busca.toLowerCase())) return false;
      if (origem === "demanda" && !a.demanda_id) return false;
      if (origem === "projeto" && !a.projeto_id) return false;
      return true;
    });
  }, [arquivos, busca, origem]);

  function podeExcluir(arquivo) {
    return (
      usuarioAtual?.permissao === "admin" ||
      usuarioAtual?.permissao === "gestor" ||
      arquivo.enviado_por?.id === usuarioAtual?.id
    );
  }

  async function handleExcluir(arquivo) {
    if (!confirm(`Remover o arquivo "${arquivo.nome_original}"?`)) return;
    const res = await fetch(`/api/arquivos/${arquivo.id}`, { method: "DELETE" });
    if (res.ok) {
      setArquivos((atual) => atual.filter((a) => a.id !== arquivo.id));
    } else {
      const data = await res.json();
      alert(data.erro || "Não foi possível remover o arquivo.");
    }
  }

  return (
    <div className="px-4 sm:px-6 py-6 max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-marine-900">Arquivos</h1>
      <p className="text-sm text-marine-500 mt-1 mb-5">
        Todos os arquivos anexados a demandas e projetos que você tem acesso, num só lugar.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          className="input sm:max-w-xs"
          placeholder="Buscar por nome do arquivo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="input sm:w-48" value={origem} onChange={(e) => setOrigem(e.target.value)}>
          <option value="">Demandas e projetos</option>
          <option value="demanda">Só de demandas</option>
          <option value="projeto">Só de projetos</option>
        </select>
      </div>

      {arquivosFiltrados.length === 0 && (
        <p className="text-sm text-marine-400 text-center py-10">
          {arquivos.length === 0 ? "Nenhum arquivo anexado ainda." : "Nada encontrado com esse filtro."}
        </p>
      )}

      <div className="space-y-2">
        {arquivosFiltrados.map((a) => (
          <div key={a.id} className="card p-3.5 flex items-center gap-3 group">
            <span className="text-lg shrink-0">{iconeArquivo(a.nome_original || a.tipo_mime)}</span>
            <div className="flex-1 min-w-0">
              <a
                href={`/api/arquivos/${a.id}`}
                className="text-sm font-medium text-marine-900 hover:text-tide-700 truncate block"
                title={a.nome_original}
              >
                {a.nome_original}
              </a>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {a.projeto && (
                  <span
                    className="inline-flex items-center rounded-md text-[11px] font-medium px-2 py-0.5"
                    style={{ backgroundColor: `${a.projeto.cor}1a`, color: a.projeto.cor }}
                  >
                    📁 {a.projeto.nome}
                  </span>
                )}
                {a.demanda && (
                  <span className="inline-flex items-center rounded-md bg-marine-50 text-marine-600 text-[11px] font-medium px-2 py-0.5">
                    {a.demanda.equipe ? "👥" : "📝"} {a.demanda.titulo}
                  </span>
                )}
                <span className="text-[11px] text-marine-400">{formatarTamanhoArquivo(a.tamanho_bytes)}</span>
                <span className="text-[11px] text-marine-400">
                  {a.enviado_por?.nome} · {formatarData(a.created_at?.slice(0, 10))}
                </span>
              </div>
            </div>
            {podeExcluir(a) && (
              <button
                type="button"
                onClick={() => handleExcluir(a)}
                className="text-marine-300 hover:text-red-500 text-xs shrink-0 opacity-0 group-hover:opacity-100"
              >
                remover
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
