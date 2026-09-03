"use client";

import { useState } from "react";
import { marked } from "marked";

marked.setOptions({ breaks: true });

export default function NotasMarkdown({ value, onChange }) {
  const [aba, setAba] = useState("escrever");

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="label mb-0">Descrição / Notas (Markdown)</span>
        <div className="flex text-[11px] rounded-md border border-marine-200 overflow-hidden">
          <button
            type="button"
            onClick={() => setAba("escrever")}
            className={`px-2.5 py-1 ${aba === "escrever" ? "bg-marine-800 text-white" : "text-marine-500"}`}
          >
            Escrever
          </button>
          <button
            type="button"
            onClick={() => setAba("preview")}
            className={`px-2.5 py-1 ${aba === "preview" ? "bg-marine-800 text-white" : "text-marine-500"}`}
          >
            Visualizar
          </button>
        </div>
      </div>

      {aba === "escrever" ? (
        <textarea
          className="input min-h-[110px] resize-y font-mono text-[13px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={"Detalhes, links de referência, insights...\n\n**negrito**, _itálico_, - lista, [link](url)"}
        />
      ) : (
        <div
          className="input min-h-[110px] markdown-preview"
          dangerouslySetInnerHTML={{ __html: value ? marked.parse(value) : "<p class='text-marine-300'>Nada para visualizar ainda.</p>" }}
        />
      )}
    </div>
  );
}
