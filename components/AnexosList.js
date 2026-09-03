"use client";

import { useEffect, useRef, useState } from "react";
import { formatarTamanhoArquivo, iconeArquivo } from "@/lib/demandaUtils";

export default function AnexosList({ demandaId, projetoId, usuarioAtual }) {
  const [arquivos, setArquivos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demandaId, projetoId]);

  async function carregar() {
    setCarregando(true);
    const params = demandaId ? `demanda_id=${demandaId}` : `projeto_id=${projetoId}`;
    const res = await fetch(`/api/arquivos?${params}`);
    const data = await res.json();
    setArquivos(data.arquivos || []);
    setCarregando(false);
  }

  async function handleSelecionarArquivo(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // permite selecionar o mesmo arquivo de novo depois
    if (!arquivo) return;

    setErro("");
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.append("arquivo", arquivo);
      if (demandaId) formData.append("demanda_id", demandaId);
      if (projetoId) formData.append("projeto_id", projetoId);

      const res = await fetch("/api/arquivos", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.erro || "Não foi possível enviar o arquivo.");
        return;
      }
      setArquivos((atual) => [data.arquivo, ...atual]);
    } catch {
      setErro("Falha de conexão ao enviar o arquivo.");
    } finally {
      setEnviando(false);
    }
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

  function podeExcluir(arquivo) {
    return (
      usuarioAtual?.permissao === "admin" ||
      usuarioAtual?.permissao === "gestor" ||
      arquivo.enviado_por?.id === usuarioAtual?.id
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="label mb-0">Anexos</span>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="btn-ghost text-xs"
          disabled={enviando}
        >
          {enviando ? "Enviando..." : "+ Anexar arquivo"}
        </button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleSelecionarArquivo} />
      </div>

      {erro && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">{erro}</p>
      )}

      {carregando && <p className="text-xs text-marine-400">Carregando anexos...</p>}

      {!carregando && arquivos.length === 0 && (
        <p className="text-xs text-marine-400">Nenhum arquivo anexado ainda.</p>
      )}

      <ul className="space-y-1.5">
        {arquivos.map((a) => (
          <li key={a.id} className="flex items-center gap-2 bg-marine-50 rounded-lg px-3 py-2 group">
            <span className="shrink-0">{iconeArquivo(a.nome_original || a.tipo_mime)}</span>
            <a
              href={`/api/arquivos/${a.id}`}
              className="flex-1 min-w-0 text-sm text-marine-800 hover:text-tide-700 truncate"
              title={a.nome_original}
            >
              {a.nome_original}
            </a>
            <span className="text-[11px] text-marine-400 shrink-0">{formatarTamanhoArquivo(a.tamanho_bytes)}</span>
            <span className="text-[11px] text-marine-400 shrink-0 hidden sm:inline">{a.enviado_por?.nome}</span>
            {podeExcluir(a) && (
              <button
                type="button"
                onClick={() => handleExcluir(a)}
                className="text-marine-300 hover:text-red-500 text-xs shrink-0 opacity-0 group-hover:opacity-100"
              >
                remover
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-marine-400 mt-1.5">Limite de 5 MB por arquivo.</p>
    </div>
  );
}
