"use client";

import { useState } from "react";
import { parseCapturaRapida } from "@/lib/demandaUtils";

export default function CapturaRapida({ onCriar }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const preview = texto.trim() ? parseCapturaRapida(texto) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    const parsed = parseCapturaRapida(texto);
    try {
      await onCriar({
        titulo: parsed.titulo || texto.trim(),
        tags: parsed.tags,
        prioridade: parsed.prioridade || undefined,
        foco_dia_data: parsed.dataAlvo || undefined,
        duracao_estimada_min: parsed.duracaoEstimadaMin || undefined,
        energia: parsed.energia || undefined,
      });
      setTexto("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-3">
      <input
        className="w-full text-sm outline-none placeholder:text-marine-300"
        placeholder="Capturar algo rápido... #tag !alta /hoje ~15min"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
      />

      {preview && (preview.tags.length > 0 || preview.prioridade || preview.dataAlvo || preview.duracaoEstimadaMin || preview.energia) && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-marine-50">
          {preview.tags.map((t) => (
            <span key={t} className="text-[11px] bg-marine-100 text-marine-700 rounded-full px-2 py-0.5">
              #{t}
            </span>
          ))}
          {preview.prioridade && (
            <span className="text-[11px] bg-red-50 text-red-700 rounded-full px-2 py-0.5">
              prioridade {preview.prioridade}
            </span>
          )}
          {preview.dataAlvo && (
            <span className="text-[11px] bg-tide-50 text-tide-700 rounded-full px-2 py-0.5">
              para {preview.dataAlvo}
            </span>
          )}
          {preview.duracaoEstimadaMin && (
            <span className="text-[11px] bg-marine-50 text-marine-600 rounded-full px-2 py-0.5">
              ~{preview.duracaoEstimadaMin}min
            </span>
          )}
          {preview.energia && (
            <span className="text-[11px] bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">
              {preview.energia}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <p className="text-[11px] text-marine-400">
          Atalhos: <code>#tag</code> <code>!alta</code> <code>/hoje</code> <code>/amanha</code> <code>~15min</code>
        </p>
        <button type="submit" className="btn-primary text-xs px-3 py-1.5" disabled={!texto.trim() || enviando}>
          {enviando ? "Adicionando..." : "Adicionar"}
        </button>
      </div>
    </form>
  );
}
